#!/usr/bin/env python3
"""Independent File Di Lam market research pipeline: Apify -> normalize -> report."""

from __future__ import annotations

import argparse
import copy
import html
import json
import math
import os
import re
import sys
import time
import unicodedata
import urllib.error
import urllib.parse
import urllib.request
from collections import Counter, defaultdict
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parent.parent
CONFIG_PATH = ROOT / "config" / "sources.json"
FIXTURE_PATH = ROOT / "fixtures" / "sample_items.json"


def load_dotenv() -> None:
    path = ROOT / ".env"
    if not path.is_file():
        return
    for raw in path.read_text(encoding="utf-8").splitlines():
        line = raw.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        os.environ.setdefault(key.strip(), value.strip().strip("'\""))


def fold(value: Any) -> str:
    text = unicodedata.normalize("NFKD", str(value or ""))
    return "".join(c for c in text if not unicodedata.combining(c)).lower().replace("đ", "d")


def number(item: dict[str, Any], *keys: str) -> int:
    for key in keys:
        value = item.get(key)
        if value is not None:
            try:
                return int(float(value))
            except (TypeError, ValueError):
                pass
    return 0


def first(item: dict[str, Any], *keys: str) -> Any:
    for key in keys:
        value = item.get(key)
        if value not in (None, "", []):
            return value
    return None


def hashtag_name(value: Any) -> str:
    if isinstance(value, dict):
        value = value.get("name", "")
    return re.sub(r"[^a-z0-9_]", "", fold(value).replace(" ", ""))


def normalize_item(raw: dict[str, Any], job: dict[str, Any]) -> dict[str, Any]:
    author_meta = raw.get("authorMeta") if isinstance(raw.get("authorMeta"), dict) else {}
    text = str(first(raw, "text", "caption", "description", "title", "name") or "")
    url = str(first(raw, "webVideoUrl", "url", "postUrl", "productUrl", "link") or "")
    title = str(first(raw, "title", "name") or (text.splitlines()[0] if text else "Không có tiêu đề"))
    price = first(raw, "price", "currentPrice", "salePrice")
    try:
        price = float(price) if price not in (None, "") else None
    except (TypeError, ValueError):
        price = None
    views = number(raw, "playCount", "views", "viewsCount", "viewCount")
    likes = number(raw, "diggCount", "likes", "likesCount", "likeCount")
    comments = number(raw, "commentCount", "comments", "commentsCount")
    shares = number(raw, "shareCount", "shares", "sharesCount")
    raw_hashtags = [tag.get("name", "") if isinstance(tag, dict) else str(tag) for tag in (raw.get("hashtags") or [])]
    source_query = hashtag_name(first(raw, "searchHashtag", "input") or "")
    normalized_hashtags = [hashtag_name(tag) for tag in raw_hashtags]
    return {
        "source_job": job["id"],
        "platform": job.get("platform", "unknown"),
        "market": job.get("market", "unknown"),
        "author": str(first(raw, "authorName", "pageName", "sellerName") or author_meta.get("name") or "Không rõ"),
        "title": title.strip(),
        "text": " ".join(text.split()),
        "url": url,
        "published_at": first(raw, "createTimeISO", "time", "timestamp", "publishedAt", "date"),
        "views": views,
        "likes": likes,
        "comments": comments,
        "shares": shares,
        "interaction_score": likes + comments * 2 + shares * 3,
        "price": price,
        "currency": str(first(raw, "currency", "currencyCode") or "VND"),
        "source_query": source_query,
        "hashtags": raw_hashtags,
        "normalized_hashtags": normalized_hashtags,
        "exact_hashtag_match": bool(source_query and source_query in normalized_hashtags),
    }


def parse_timestamp(value: Any) -> datetime | None:
    if value in (None, ""):
        return None
    if isinstance(value, (int, float)):
        timestamp = float(value)
        if timestamp > 10_000_000_000:
            timestamp /= 1000
        try:
            return datetime.fromtimestamp(timestamp, tz=timezone.utc)
        except (ValueError, OSError, OverflowError):
            return None
    text = str(value).strip()
    if text.isdigit():
        return parse_timestamp(int(text))
    try:
        parsed = datetime.fromisoformat(text.replace("Z", "+00:00"))
        return parsed if parsed.tzinfo else parsed.replace(tzinfo=timezone.utc)
    except ValueError:
        return None


def lane_topic_ids(job_id: str, topics: dict[str, list[str]]) -> list[str]:
    suffix = job_id.removeprefix("tiktok_")
    aliases = {
        "project_reporting": ["project_management", "management_reporting"],
        "excel_sheets_apps": ["tool_formats"],
    }
    return aliases.get(suffix, [suffix] if suffix in topics else [])


def filter_exact_hashtags(items: list[dict[str, Any]]) -> tuple[list[dict[str, Any]], int]:
    kept: list[dict[str, Any]] = []
    dropped = 0
    for item in items:
        if item.get("platform") == "tiktok" and not item.get("exact_hashtag_match"):
            dropped += 1
            continue
        kept.append(item)
    return kept, dropped


def filter_relevant(items: list[dict[str, Any]], config: dict[str, Any]) -> tuple[list[dict[str, Any]], int]:
    topics = config.get("research_topics", {})
    global_excludes = [fold(value) for value in config.get("relevance_exclude_phrases", [])]
    anchors = [fold(value) for value in config.get("relevance_anchor_phrases", [])]
    kept: list[dict[str, Any]] = []
    dropped = 0
    for item in items:
        topic_ids = lane_topic_ids(str(item.get("source_job", "")), topics)
        text = fold(" ".join([str(item.get("title", "")), str(item.get("text", "")), " ".join(item.get("hashtags", []))]))
        compact_tags = item.get("normalized_hashtags") or [hashtag_name(tag) for tag in item.get("hashtags", [])]

        def matches(phrase: str) -> bool:
            folded_phrase = fold(phrase)
            compact_phrase = hashtag_name(phrase)
            return folded_phrase in text or any(compact_phrase and compact_phrase in tag for tag in compact_tags)

        matched: dict[str, list[str]] = {}
        for topic_id in topic_ids:
            hits = [keyword for keyword in topics.get(topic_id, []) if matches(keyword)]
            if hits:
                matched[topic_id] = hits
        excluded = [phrase for phrase in global_excludes if phrase and matches(phrase)]
        anchor_hits = [phrase for phrase in anchors if phrase and matches(phrase)]
        item["matched_topics"] = matched
        item["relevance_score"] = sum(len(values) for values in matched.values())
        item["excluded_phrases"] = excluded
        item["anchor_hits"] = anchor_hits
        if not matched or excluded or not anchor_hits:
            dropped += 1
            continue
        kept.append(item)
    return kept, dropped


def dedupe_and_filter(items: list[dict[str, Any]], start: datetime, end: datetime) -> tuple[list[dict[str, Any]], dict[str, int]]:
    kept: list[dict[str, Any]] = []
    seen: set[str] = set()
    dropped_duplicate = 0
    dropped_outside_window = 0
    unknown_date = 0
    for item in items:
        published = parse_timestamp(item.get("published_at"))
        if published is None:
            unknown_date += 1
        elif not (start <= published <= end):
            dropped_outside_window += 1
            continue
        key = str(item.get("url") or "").strip()
        if not key:
            key = fold(f"{item.get('platform')}|{item.get('author')}|{item.get('title')}|{item.get('published_at')}")
        if key in seen:
            dropped_duplicate += 1
            continue
        seen.add(key)
        kept.append(item)
    return kept, {
        "dropped_duplicate": dropped_duplicate,
        "dropped_outside_window": dropped_outside_window,
        "unknown_date": unknown_date,
    }


def estimated_items(job: dict[str, Any]) -> int:
    actor_input = job.get("input", {})
    result_count = int(actor_input.get("resultsPerPage", actor_input.get("resultsLimit", 0)) or 0)
    units = max(len(actor_input.get("hashtags", [])), len(actor_input.get("profiles", [])), 1)
    return result_count * units


def build_hashtag_diagnostics(items: list[dict[str, Any]], jobs: list[dict[str, Any]], start: datetime, end: datetime) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    for job in jobs:
        for requested in job.get("input", {}).get("hashtags", []):
            query = hashtag_name(requested)
            query_items = [item for item in items if item.get("source_job") == job["id"] and item.get("source_query") == query]
            exact_items = [item for item in query_items if item.get("exact_hashtag_match")]
            in_window = 0
            for item in exact_items:
                published = parse_timestamp(item.get("published_at"))
                if published is not None and start <= published <= end:
                    in_window += 1
            rows.append({"lane": job["id"], "hashtag": query, "raw": len(query_items), "exact": len(exact_items), "in_window": in_window})
    return rows


def call_apify(job: dict[str, Any], token: str, timeout: int) -> list[dict[str, Any]]:
    actor = urllib.parse.quote(job["actor_id"], safe="~")
    url = f"https://api.apify.com/v2/acts/{actor}/run-sync-get-dataset-items"
    request = urllib.request.Request(
        url,
        data=json.dumps(job.get("input", {}), ensure_ascii=False).encode("utf-8"),
        headers={"Content-Type": "application/json", "User-Agent": "FileDiLam-MarketResearch/1.0", "Authorization": f"Bearer {token}"},
        method="POST",
    )
    with urllib.request.urlopen(request, timeout=timeout) as response:
        payload = json.loads(response.read().decode("utf-8"))
    if not isinstance(payload, list):
        raise RuntimeError(f"Actor {job['id']} không trả về danh sách dataset items.")
    return payload


def topic_scores(items: list[dict[str, Any]], topics: dict[str, list[str]]) -> tuple[Counter, dict[str, list[dict[str, Any]]]]:
    scores: Counter = Counter()
    evidence: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for item in items:
        haystack = fold(f"{item.get('title', '')} {item.get('text', '')}")
        for topic, keywords in topics.items():
            matches = [keyword for keyword in keywords if fold(keyword) in haystack]
            if matches:
                weight = 1 + min(item.get("interaction_score", 0), 100000) / 100000
                scores[topic] += weight * len(matches)
                evidence[topic].append(item)
    return scores, evidence


PRODUCT_IDEAS = {
    "finance_accounting": "Bộ Thu Chi – Dòng Tiền – Công Nợ", "hr_payroll": "Bộ Chấm Công – Tính Lương – KPI",
    "administration_office": "Bộ Hành Chính – Hồ Sơ – Tài Sản", "sales_crm": "CRM Mini – Lead – Báo Giá – Doanh Số",
    "marketing": "Marketing Planner – Content – Campaign Report", "inventory_procurement": "Kho – Mua Hàng – Nhà Cung Cấp",
    "project_management": "Quản Lý Dự Án – Tiến Độ – Nguồn Lực", "management_reporting": "Dashboard và Báo Cáo Quản Trị SME",
    "sop_forms": "Bộ SOP – Checklist – Biểu Mẫu Vận Hành", "industry_solutions": "Bộ Công Cụ Vận Hành Chuyên Ngành",
    "tool_formats": "Excel/Google Sheets/Apps Script Automation",
}
PURCHASE_INTENT_PHRASES = ["mua file", "xin file", "gửi file", "giá bao nhiêu", "mua ở đâu", "link file", "tải file", "file excel", "mẫu file", "template", "link bio", "inbox nhận file", "comment nhận file", "google sheets", "apps script"]


def analyze_product_opportunities(items: list[dict[str, Any]]) -> list[dict[str, Any]]:
    buckets: dict[str, dict[str, Any]] = {}
    for item in items:
        text = fold(f"{item.get('title', '')} {item.get('text', '')}")
        purchase_hits = [phrase for phrase in PURCHASE_INTENT_PHRASES if fold(phrase) in text]
        for topic_id in (item.get("matched_topics") or {}).keys():
            bucket = buckets.setdefault(topic_id, {"topic_id": topic_id, "product": PRODUCT_IDEAS.get(topic_id, topic_id.replace("_", " ").title()), "evidence_count": 0, "purchase_signal_count": 0, "views": 0, "comments": 0, "videos": []})
            bucket["evidence_count"] += 1; bucket["purchase_signal_count"] += int(bool(purchase_hits)); bucket["views"] += int(item.get("views", 0)); bucket["comments"] += int(item.get("comments", 0)); bucket["videos"].append(item)
    output: list[dict[str, Any]] = []
    for bucket in buckets.values():
        bucket["score"] = round(bucket["evidence_count"] * 20 + bucket["purchase_signal_count"] * 35 + min(math.log10(max(bucket["views"], 1)) * 5, 30) + min(math.log10(max(bucket["comments"], 1)) * 4, 15), 1)
        if bucket["purchase_signal_count"] >= 2 and bucket["evidence_count"] >= 3: bucket["confidence"] = "Có tín hiệu mua — ưu tiên thẩm định"
        elif bucket["purchase_signal_count"] >= 1: bucket["confidence"] = "Có tín hiệu lấy/mua file — cần thêm bằng chứng"
        else: bucket["confidence"] = "Mới có quan tâm/nghiệp vụ — chưa đủ bằng chứng mua"
        bucket["videos"] = sorted(bucket["videos"], key=lambda x: x.get("interaction_score", 0), reverse=True)[:3]; output.append(bucket)
    return sorted(output, key=lambda x: (x["purchase_signal_count"], x["score"]), reverse=True)


def build_html_report(run_id: str, start: datetime, end: datetime, items: list[dict[str, Any]], config: dict[str, Any]) -> str:
    cards = []
    for index, opportunity in enumerate(analyze_product_opportunities(items)[:6], 1):
        links = "".join(f'<li><a href="{html.escape(str(video.get("url", "")))}" target="_blank">{html.escape(str(video.get("title", ""))[:110])}</a></li>' for video in opportunity["videos"] if video.get("url"))
        cards.append(f'<article class="card"><div class="rank">#{index}</div><h3>{html.escape(opportunity["product"])}</h3><div class="confidence">{html.escape(opportunity["confidence"])}</div><div class="metrics"><span><b>{opportunity["evidence_count"]}</b> bằng chứng</span><span><b>{opportunity["purchase_signal_count"]}</b> tín hiệu mua</span><span><b>{opportunity["views"]:,}</b> views</span><span><b>{opportunity["comments"]:,}</b> comments</span></div><p>Điểm cơ hội: <b>{opportunity["score"]}</b></p><ul>{links or "<li>Chưa có URL bằng chứng.</li>"}</ul></article>')
    empty = "" if cards else '<div class="empty"><h3>Chưa đủ dữ liệu để đề xuất sản phẩm</h3><p>Hãy chạy thêm lane hoặc thu thập comment có ý định mua. Pipeline không suy diễn từ dữ liệu rỗng.</p></div>'
    rows = [f'<tr><td>#{html.escape(str(item.get("source_query", "")))}</td><td>{html.escape(str(item.get("author", "")))}</td><td><a href="{html.escape(str(item.get("url", "")))}" target="_blank">{html.escape(str(item.get("title", ""))[:120])}</a></td><td>{int(item.get("views", 0)):,}</td><td>{int(item.get("comments", 0)):,}</td></tr>' for item in sorted(items, key=lambda x: x.get("interaction_score", 0), reverse=True)[:30]]
    return f'''<!doctype html><html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>File Đi Làm — Market Insight {html.escape(run_id)}</title><style>body{{margin:0;background:#f6f4ef;color:#26342f;font:15px/1.55 Arial,sans-serif}}.wrap{{max-width:1180px;margin:auto;padding:28px}}.hero{{background:linear-gradient(135deg,#174b3f,#7b6544);color:white;padding:30px;border-radius:20px}}h1{{margin:0 0 8px}}h2{{margin-top:34px;color:#174b3f}}.note{{background:#fff3cd;border-left:5px solid #d6a61f;padding:14px 16px;border-radius:10px;margin:18px 0}}.grid{{display:grid;grid-template-columns:repeat(auto-fit,minmax(310px,1fr));gap:16px}}.card,.empty{{background:white;border:1px solid #e3ded2;border-radius:16px;padding:18px;box-shadow:0 6px 20px #1b392b12}}.rank{{font-size:12px;color:#987a43;font-weight:bold}}.card h3{{margin:5px 0}}.confidence{{color:#7b5630;font-weight:bold;margin-bottom:12px}}.metrics{{display:grid;grid-template-columns:1fr 1fr;gap:8px}}.metrics span{{background:#f4f0e8;padding:9px;border-radius:9px}}a{{color:#176b58}}table{{width:100%;border-collapse:collapse;background:white}}th,td{{padding:11px;border:1px solid #e4dfd5;text-align:left;vertical-align:top}}th{{background:#eaf2ee}}@media(max-width:700px){{.wrap{{padding:14px}}.metrics{{grid-template-columns:1fr}}}}</style></head><body><main class="wrap"><section class="hero"><div>FILE ĐI LÀM · MARKET INTELLIGENCE</div><h1>Khách hàng đang cần loại file gì?</h1><p>Kỳ {start:%d/%m/%Y} – {end:%d/%m/%Y} · Run {html.escape(run_id)} · {len(items)} bằng chứng hợp lệ</p></section><div class="note"><b>Cách đọc:</b> “Quan tâm” không đồng nghĩa “mua”. Chỉ nhãn có tín hiệu lấy/mua file mới được dùng làm căn cứ thương mại; các cơ hội còn lại cần đọc video và comment trước khi quyết định build.</div><h2>Ưu tiên sản phẩm</h2><section class="grid">{''.join(cards)}{empty}</section><h2>Bằng chứng TikTok</h2><table><thead><tr><th>Hashtag</th><th>Creator</th><th>Nội dung</th><th>Views</th><th>Comments</th></tr></thead><tbody>{''.join(rows) or '<tr><td colspan="5">Chưa có bằng chứng hợp lệ.</td></tr>'}</tbody></table></main></body></html>'''


def money(value: Any) -> str:
    if value is None:
        return "—"
    return f"{float(value):,.0f}"


def md_escape(value: Any) -> str:
    return str(value or "").replace("|", "\\|").replace("\n", " ")


def build_report(run_id: str, start: datetime, end: datetime, items: list[dict[str, Any]], statuses: list[dict[str, Any]], config: dict[str, Any]) -> str:
    scores, evidence = topic_scores(items, config["research_topics"])
    report_top_n = int(config.get("report_top_n", 6))
    top_items = sorted(items, key=lambda x: (x.get("interaction_score", 0), x.get("views", 0)), reverse=True)[:report_top_n]
    prices = [x["price"] for x in items if isinstance(x.get("price"), (int, float)) and x["price"] > 0]
    platforms = Counter(x.get("platform", "unknown") for x in items)
    authors = Counter(x.get("author", "Không rõ") for x in items)
    brand = config.get("_brand", {})
    brand_info = brand.get("brand", {})
    domain_names = [domain.get("name", domain.get("id", "")) for domain in brand.get("product_domains", [])]
    lines = [
        "# Báo cáo nghiên cứu thị trường File Đi Làm",
        "",
        f"- Run ID: `{run_id}`",
        f"- Kỳ dữ liệu yêu cầu: {start:%d/%m/%Y} – {end:%d/%m/%Y}",
        f"- Tổng bản ghi chuẩn hóa: **{len(items):,}**",
        f"- Trùng lặp đã loại: **{config.get('_quality', {}).get('dropped_duplicate', 0):,}**",
        f"- Ngoài kỳ đã loại: **{config.get('_quality', {}).get('dropped_outside_window', 0):,}**",
        f"- Không liên quan đã loại: **{config.get('_quality', {}).get('dropped_irrelevant', 0):,}**",
        f"- Sai hashtag chính xác đã loại: **{config.get('_quality', {}).get('dropped_hashtag_mismatch', 0):,}**",
        f"- Bản ghi không xác định được ngày: **{config.get('_quality', {}).get('unknown_date', 0):,}**",
        "- Lưu ý: tương tác và giá niêm yết là tín hiệu thị trường; không suy diễn thành số đơn bán nếu nguồn không công khai số bán.",
        "",
        "## 0. Kim chỉ nam thương hiệu",
        "",
        f"- Định vị: {brand_info.get('positioning', 'Chưa khai báo')}",
        f"- Lời hứa: {brand_info.get('promise', 'Chưa khai báo')}",
        f"- Phạm vi nghiên cứu: {', '.join(domain_names) if domain_names else 'Chưa khai báo'}",
        "",
        "## 1. Độ phủ dữ liệu",
        "",
        "| Nguồn | Trạng thái | Raw | Chuẩn hóa | Ghi chú |",
        "| --- | --- | ---: | ---: | --- |",
    ]
    for row in statuses:
        lines.append(f"| {md_escape(row['id'])} | {md_escape(row['status'])} | {row['raw_count']} | {row['normalized_count']} | {md_escape(row.get('error', ''))} |")
    diagnostics = config.get("_hashtag_diagnostics", [])
    if diagnostics:
        lines += ["", "### Sức khỏe hashtag", "", "| Lane | Hashtag | Raw | Đúng hashtag | Trong kỳ | Đánh giá |", "| --- | --- | ---: | ---: | ---: | --- |"]
        for row in diagnostics:
            if row["exact"] == 0:
                assessment = "Sai/gần giống — cần thay"
            elif row["in_window"] == 0:
                assessment = "Đúng nhưng ít hoạt động"
            else:
                assessment = "Hoạt động"
            lines.append(f"| {md_escape(row['lane'])} | #{md_escape(row['hashtag'])} | {row['raw']} | {row['exact']} | {row['in_window']} | {assessment} |")
    lines += ["", "### Theo nền tảng", ""]
    for platform, count in platforms.most_common():
        lines.append(f"- {platform}: {count:,} bản ghi")
    lines += ["", "### Creator/kênh xuất hiện nhiều", ""]
    for author, count in authors.most_common(10):
        lines.append(f"- {author}: {count:,} bản ghi")

    lines += ["", "## 2. Nhu cầu nổi bật", "", "| Hạng | Nhóm nhu cầu | Điểm tín hiệu | Số bằng chứng |", "| ---: | --- | ---: | ---: |"]
    for rank, (topic, score) in enumerate(scores.most_common(), 1):
        lines.append(f"| {rank} | {topic.replace('_', ' ').title()} | {score:.1f} | {len(evidence[topic])} |")
    if not scores:
        lines.append("| — | Chưa đủ dữ liệu để xếp hạng | 0 | 0 |")

    lines += ["", "## 3. Nội dung/listing có tín hiệu cao", "", "| Hạng | Hashtag đúng | Tiêu đề | Views | Tương tác quy đổi | Giá | Link |", "| ---: | --- | --- | ---: | ---: | ---: | --- |"]
    for rank, item in enumerate(top_items, 1):
        link = f"[Mở]({item['url']})" if item.get("url") else "—"
        lines.append(f"| {rank} | #{md_escape(item.get('source_query', ''))} | {md_escape(item['title'][:100])} | {item['views']:,} | {item['interaction_score']:,} | {money(item.get('price'))} | {link} |")

    lines += ["", "## 4. Tín hiệu giá", ""]
    if prices:
        ordered = sorted(prices)
        lines += [
            f"- Số listing có giá đọc được: {len(ordered):,}",
            f"- Giá thấp nhất: {money(ordered[0])}",
            f"- Trung vị quan sát: {money(ordered[len(ordered)//2])}",
            f"- Giá cao nhất: {money(ordered[-1])}",
        ]
    else:
        lines.append("- Nguồn hiện tại chưa trả dữ liệu giá đủ tin cậy.")

    ranked = [topic for topic, _ in scores.most_common(3)]
    lines += ["", "## 5. Danh sách sản phẩm cần thẩm định tiếp", ""]
    if ranked:
        for index, topic in enumerate(ranked, 1):
            lines.append(f"{index}. **{topic.replace('_', ' ').title()}** — kiểm tra sâu tính năng, mức giá và review tiêu cực trước khi chốt build.")
    else:
        lines.append("1. Chưa đưa ra quyết định sản phẩm vì dữ liệu mẫu chưa đủ.")
    lines += [
        "",
        "## 6. Quy tắc ra quyết định",
        "",
        "- Không chọn sản phẩm chỉ vì có một video nhiều view.",
        "- Ưu tiên nhu cầu lặp lại trên nhiều nguồn và có bằng chứng khách sẵn sàng trả tiền.",
        "- Đọc review tiêu cực để xác định khoảng trống tính năng và trải nghiệm.",
        "- Chỉ chuyển thành đặc tả workbook sau khi đã kiểm tra thủ công các bằng chứng hàng đầu.",
    ]
    return "\n".join(lines).strip() + "\n"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="File Đi Làm market research pipeline")
    mode = parser.add_mutually_exclusive_group()
    mode.add_argument("--live", action="store_true", help="Gọi Apify thật")
    mode.add_argument("--dry-run", action="store_true", help="Dùng fixture, không gọi mạng")
    parser.add_argument("--lookback-days", type=int)
    parser.add_argument("--start", help="YYYY-MM-DD")
    parser.add_argument("--end", help="YYYY-MM-DD")
    parser.add_argument("--lane", action="append", help="ID lane cần chạy; có thể truyền nhiều lần")
    parser.add_argument("--rotation", action="store_true", help="Tự chọn lane theo vòng quay tuần")
    parser.add_argument("--max-jobs", type=int, help="Giới hạn số lane trong một run")
    parser.add_argument("--max-items-per-job", type=int, help="Ghi đè resultsPerPage để chạy pilot nhỏ")
    parser.add_argument("--list-lanes", action="store_true", help="Liệt kê lane rồi thoát")
    return parser.parse_args()


def select_jobs(config: dict[str, Any], args: argparse.Namespace, now: datetime) -> list[dict[str, Any]]:
    all_jobs = config.get("jobs", [])
    if args.list_lanes:
        for job in all_jobs:
            print(f"{job['id']}\tenabled={str(bool(job.get('enabled'))).lower()}\testimated_items={estimated_items(job)}")
        return []
    if args.lane:
        requested = set(args.lane)
        unknown = requested - {job["id"] for job in all_jobs}
        if unknown:
            raise SystemExit(f"Lane không tồn tại: {', '.join(sorted(unknown))}")
        jobs = [job for job in all_jobs if job["id"] in requested]
    elif args.rotation:
        if not all_jobs:
            return []
        count = args.max_jobs or int(config.get("max_jobs_per_run", 2))
        start_index = now.isocalendar().week % len(all_jobs)
        jobs = [all_jobs[(start_index + offset) % len(all_jobs)] for offset in range(min(count, len(all_jobs)))]
    else:
        jobs = [job for job in all_jobs if job.get("enabled")]
    max_jobs = args.max_jobs or int(config.get("max_jobs_per_run", 2))
    if len(jobs) > max_jobs:
        raise SystemExit(f"Run yêu cầu {len(jobs)} lane, vượt giới hạn {max_jobs}. Dùng --max-jobs để duyệt rõ giới hạn mới.")
    selected = copy.deepcopy(jobs)
    if args.max_items_per_job:
        if args.max_items_per_job <= 0:
            raise SystemExit("--max-items-per-job phải lớn hơn 0.")
        for job in selected:
            job.setdefault("input", {})["resultsPerPage"] = args.max_items_per_job
    estimate = sum(estimated_items(job) for job in selected)
    ceiling = int(config.get("max_estimated_items_per_run", 96))
    if estimate > ceiling:
        raise SystemExit(f"Ước tính {estimate} item vượt trần {ceiling}. Giảm lane/kết quả hoặc điều chỉnh trần có chủ đích.")
    return selected


def main() -> int:
    args = parse_args()
    load_dotenv()
    config = json.loads(CONFIG_PATH.read_text(encoding="utf-8"))
    brand_path = (CONFIG_PATH.parent / config["brand_source"]).resolve()
    if not brand_path.is_file():
        raise SystemExit(f"Không tìm thấy Brand JSON: {brand_path}")
    config["_brand"] = json.loads(brand_path.read_text(encoding="utf-8"))
    if args.list_lanes:
        select_jobs(config, args, datetime.now(timezone.utc))
        return 0
    now = datetime.now(timezone.utc)
    end = datetime.fromisoformat(args.end).replace(tzinfo=timezone.utc) if args.end else now
    lookback = args.lookback_days or int(config.get("default_lookback_days", 7))
    start = datetime.fromisoformat(args.start).replace(tzinfo=timezone.utc) if args.start else end - timedelta(days=lookback)
    if start >= end:
        raise SystemExit("Ngày bắt đầu phải trước ngày kết thúc.")
    live = bool(args.live)
    run_id = now.astimezone().strftime("%Y%m%d_%H%M%S")
    run_root = ROOT / "data" / run_id
    raw_root = run_root / "raw"
    raw_root.mkdir(parents=True, exist_ok=True)
    (ROOT / "reports").mkdir(parents=True, exist_ok=True)
    (ROOT / "logs").mkdir(parents=True, exist_ok=True)
    token = os.getenv("APIFY_TOKEN", "")
    if live and not token:
        raise SystemExit("Thiếu APIFY_TOKEN. Tạo market_research/.env từ .env.example.")

    items: list[dict[str, Any]] = []
    statuses: list[dict[str, Any]] = []
    active_jobs: list[dict[str, Any]] = []
    if not live:
        raw_items = json.loads(FIXTURE_PATH.read_text(encoding="utf-8"))
        fixture_job = {"id": "offline_fixture", "platform": "mixed", "market": "Vietnam"}
        for raw in raw_items:
            normalized = dict(raw)
            normalized.setdefault("source_job", raw.get("source_job", "offline_fixture"))
            normalized.setdefault("interaction_score", number(raw, "likes") + number(raw, "comments") * 2 + number(raw, "shares") * 3)
            normalized.setdefault("exact_hashtag_match", True)
            normalized.setdefault("source_query", "offline_fixture")
            normalized.setdefault("hashtags", [])
            items.append(normalized)
        statuses.append({"id": "offline_fixture", "status": "dry_run", "raw_count": len(raw_items), "normalized_count": len(items), "error": ""})
    else:
        jobs = select_jobs(config, args, now)
        active_jobs = jobs
        if not jobs:
            raise SystemExit("Không có job nào enabled trong config/sources.json.")
        for job in jobs:
            try:
                raw_items = call_apify(job, token, int(config.get("request_timeout_seconds", 360)))
                (raw_root / f"{job['id']}.json").write_text(json.dumps(raw_items, ensure_ascii=False, indent=2), encoding="utf-8")
                normalized = [normalize_item(raw, job) for raw in raw_items if isinstance(raw, dict)]
                items.extend(normalized)
                statuses.append({"id": job["id"], "status": "success", "raw_count": len(raw_items), "normalized_count": len(normalized), "error": ""})
            except (urllib.error.URLError, TimeoutError, RuntimeError, ValueError) as exc:
                statuses.append({"id": job["id"], "status": "error", "raw_count": 0, "normalized_count": 0, "error": str(exc)[:300]})
            time.sleep(int(config.get("pause_between_jobs_seconds", 3)))

    config["_hashtag_diagnostics"] = build_hashtag_diagnostics(items, active_jobs, start, end)
    items, dropped_hashtag_mismatch = filter_exact_hashtags(items)
    items, dropped_irrelevant = filter_relevant(items, config)
    items, quality = dedupe_and_filter(items, start, end)
    quality["dropped_irrelevant"] = dropped_irrelevant
    quality["dropped_hashtag_mismatch"] = dropped_hashtag_mismatch
    (run_root / "normalized.json").write_text(json.dumps(items, ensure_ascii=False, indent=2), encoding="utf-8")
    config["_quality"] = quality
    report = build_report(run_id, start, end, items, statuses, config)
    report_path = ROOT / "reports" / f"{run_id}_market_report.md"
    report_path.write_text(report, encoding="utf-8")
    html_report_path = ROOT / "reports" / f"{run_id}_market_insight.html"
    html_report_path.write_text(build_html_report(run_id, start, end, items, config), encoding="utf-8")
    manifest = {
        "run_id": run_id,
        "mode": "live" if live else "dry_run",
        "started_at": now.isoformat(),
        "period_start": start.isoformat(),
        "period_end": end.isoformat(),
        "item_count": len(items),
        "quality": quality,
        "statuses": statuses,
        "report_path": str(report_path.relative_to(ROOT)),
        "html_report_path": str(html_report_path.relative_to(ROOT)),
    }
    (ROOT / "logs" / f"{run_id}.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Pipeline completed ({manifest['mode']}): {html_report_path}")
    return 0


if __name__ == "__main__":
    sys.exit(main())

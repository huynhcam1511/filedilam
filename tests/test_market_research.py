from __future__ import annotations

import argparse
import importlib.util
import json
import unittest
from datetime import datetime, timezone
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SCRIPT = ROOT / "market_research" / "scripts" / "run_pipeline.py"
SPEC = importlib.util.spec_from_file_location("file_di_lam_market_research", SCRIPT)
MODULE = importlib.util.module_from_spec(SPEC)
assert SPEC.loader is not None
SPEC.loader.exec_module(MODULE)


class MarketResearchPipelineTest(unittest.TestCase):
    def test_brand_and_config_scope_match(self):
        brand = json.loads((ROOT / "FILE_DI_LAM_BRAND.json").read_text(encoding="utf-8"))
        config = json.loads((ROOT / "market_research" / "config" / "sources.json").read_text(encoding="utf-8"))
        self.assertEqual(brand["brand"]["name"], "File Đi Làm")
        self.assertEqual(len(brand["product_domains"]), 10)
        self.assertEqual(len(config["jobs"]), 10)
        self.assertEqual({job["platform"] for job in config["jobs"]}, {"tiktok"})

    def test_rotation_respects_cost_guard(self):
        config = json.loads((ROOT / "market_research" / "config" / "sources.json").read_text(encoding="utf-8"))
        args = argparse.Namespace(list_lanes=False, lane=None, rotation=True, max_jobs=2, max_items_per_job=None)
        jobs = MODULE.select_jobs(config, args, datetime(2026, 8, 22, tzinfo=timezone.utc))
        self.assertEqual(len(jobs), 2)
        self.assertLessEqual(sum(MODULE.estimated_items(job) for job in jobs), config["max_estimated_items_per_run"])

    def test_dedupe_and_date_filter(self):
        items = [
            {"url": "https://example.com/a", "published_at": "2026-08-20T00:00:00Z"},
            {"url": "https://example.com/a", "published_at": "2026-08-20T00:00:00Z"},
            {"url": "https://example.com/old", "published_at": "2026-07-01T00:00:00Z"},
        ]
        kept, quality = MODULE.dedupe_and_filter(
            items,
            datetime(2026, 8, 8, tzinfo=timezone.utc),
            datetime(2026, 8, 22, tzinfo=timezone.utc),
        )
        self.assertEqual(len(kept), 1)
        self.assertEqual(quality["dropped_duplicate"], 1)
        self.assertEqual(quality["dropped_outside_window"], 1)

    def test_relevance_filter_removes_false_positive(self):
        config = json.loads((ROOT / "market_research" / "config" / "sources.json").read_text(encoding="utf-8"))
        items = [
            {"source_job": "tiktok_finance_accounting", "title": "Theo dõi công nợ khách hàng", "text": "File Excel cho SME", "hashtags": []},
            {"source_job": "tiktok_finance_accounting", "title": "Fine Congo babes", "text": "congolaise congo tiktok", "hashtags": []},
            {"source_job": "tiktok_finance_accounting", "title": "Mua cổ phiếu", "text": "đầu tư chứng khoán và báo cáo tài chính", "hashtags": []},
            {"source_job": "tiktok_finance_accounting", "title": "Đồng tiền remix", "text": "#dongtien", "hashtags": ["dongtien"]},
        ]
        kept, dropped = MODULE.filter_relevant(items, config)
        self.assertEqual(len(kept), 1)
        self.assertEqual(dropped, 3)
        self.assertIn("finance_accounting", kept[0]["matched_topics"])

    def test_exact_hashtag_filter(self):
        items = [
            {"platform": "tiktok", "source_query": "congno", "normalized_hashtags": ["congotiktok"], "exact_hashtag_match": False},
            {"platform": "tiktok", "source_query": "baocaotaichinh", "normalized_hashtags": ["baocaotaichinh"], "exact_hashtag_match": True},
        ]
        kept, dropped = MODULE.filter_exact_hashtags(items)
        self.assertEqual(len(kept), 1)
        self.assertEqual(dropped, 1)
        self.assertEqual(kept[0]["source_query"], "baocaotaichinh")

    def test_compound_hashtag_matches_business_term(self):
        config = json.loads((ROOT / "market_research" / "config" / "sources.json").read_text(encoding="utf-8"))
        items = [{
            "source_job": "tiktok_finance_accounting",
            "title": "225 DN mua bán hóa đơn",
            "text": "Làm gì khi DN có hóa đơn đầu vào?",
            "hashtags": ["daotaoketoan"],
            "normalized_hashtags": ["daotaoketoan"],
        }]
        kept, dropped = MODULE.filter_relevant(items, config)
        self.assertEqual(dropped, 0)
        self.assertEqual(len(kept), 1)
        self.assertIn("kế toán", kept[0]["matched_topics"]["finance_accounting"])

    def test_hashtag_diagnostics_marks_exact_and_window(self):
        jobs = [{"id": "lane", "input": {"hashtags": ["baocaotaichinh", "quanlycongno"]}}]
        items = [
            {"source_job": "lane", "source_query": "baocaotaichinh", "exact_hashtag_match": True, "published_at": "2026-08-20T00:00:00Z"},
            {"source_job": "lane", "source_query": "quanlycongno", "exact_hashtag_match": False, "published_at": "2026-08-20T00:00:00Z"},
        ]
        rows = MODULE.build_hashtag_diagnostics(items, jobs, datetime(2026, 8, 8, tzinfo=timezone.utc), datetime(2026, 8, 22, tzinfo=timezone.utc))
        self.assertEqual(rows[0]["exact"], 1)
        self.assertEqual(rows[0]["in_window"], 1)
        self.assertEqual(rows[1]["exact"], 0)

    def test_html_report_is_openable_and_honest(self):
        config = json.loads((ROOT / "market_research" / "config" / "sources.json").read_text(encoding="utf-8"))
        html_text = MODULE.build_html_report("TEST", datetime(2026, 8, 8, tzinfo=timezone.utc), datetime(2026, 8, 22, tzinfo=timezone.utc), [], config)
        self.assertIn("<!doctype html>", html_text)
        self.assertIn("Khách hàng đang cần loại file gì?", html_text)
        self.assertIn("Chưa đủ dữ liệu", html_text)


if __name__ == "__main__":
    unittest.main()

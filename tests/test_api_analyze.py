from __future__ import annotations

import json
from pathlib import Path

from api.main import analyze_uploaded_case


def test_uploaded_case_analysis_is_stateless():
    document = json.loads(
        (Path(__file__).parent.parent / "data" / "data.json").read_text(encoding="utf-8")
    )
    raw_case = document["cases"][0]

    result = analyze_uploaded_case({"case": raw_case})

    assert result["details"].case_id == raw_case["case_id"]
    assert len(result["timeline"]) == len(raw_case["days"])
    assert result["run_out"].run_out_date
    assert result["recharge"].breakdown_valid is True
    assert len(result["comparison"]) == 2


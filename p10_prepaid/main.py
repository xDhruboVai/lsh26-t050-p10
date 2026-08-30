from __future__ import annotations

import argparse
from pathlib import Path

from .loader import load_cases, validate_case
from .simulate import rebuild_balance_timeline


def main() -> None:
    parser = argparse.ArgumentParser(description="P10 prepaid meter advisor")
    parser.add_argument("--case", type=str, default="data.json", help="Path to the case JSON file")
    args = parser.parse_args()

    cases = load_cases(Path(args.case))
    for case in cases:
        validate_case(case)
        timeline = rebuild_balance_timeline(case)
        print(case["case_id"], len(timeline), timeline[0]["date"], timeline[-1]["date"])


if __name__ == "__main__":
    main()

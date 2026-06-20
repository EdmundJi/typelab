#!/usr/bin/env python3
"""Calculates git contribution stats and updates the leaderboard in README.md."""

import subprocess
from collections import defaultdict
from datetime import date

# Map raw git author names to (display_name, github_username)
IDENTITY_MAP = {
    "AsherDe":          ("Edmund Ji", "EdmundJi"),
    "Asher Ji":         ("Edmund Ji", "EdmundJi"),
    "EdmundJi":         ("Edmund Ji", "EdmundJi"),
    "Edmund Ji":        ("Edmund Ji", "EdmundJi"),
    "ZhangEve":         ("ZhangEve", "Eve993657"),
    "Frank":            ("Frank", None),
    "Frank-StarsChild": ("Frank-StarsChild", "Frank-StarsChild"),
    "Yang":             ("Yang", None),
    "Kalin":            ("Kalin", None),
    "griffty73-debug":  ("griffty73", "griffty73-debug"),
}

MEDALS = {1: "🥇", 2: "🥈", 3: "🥉"}

START_MARKER = "<!-- LEADERBOARD:START -->"
END_MARKER   = "<!-- LEADERBOARD:END -->"


def resolve(raw: str) -> tuple[str, str | None]:
    return IDENTITY_MAP.get(raw, (raw, None))


def get_stats() -> tuple[dict, dict, dict, dict]:
    commits: dict[str, int]   = defaultdict(int)
    adds:    dict[str, int]   = defaultdict(int)
    dels:    dict[str, int]   = defaultdict(int)
    github:  dict[str, str]   = {}

    out = subprocess.check_output(
        ["git", "log", "--all", "--format=COMMIT %aN", "--numstat"],
        text=True,
    )

    current: str | None = None
    for line in out.splitlines():
        if line.startswith("COMMIT "):
            raw = line[7:]
            display, gh = resolve(raw)
            current = display
            commits[display] += 1
            if gh:
                github[display] = gh
        elif current and "\t" in line:
            parts = line.split("\t")
            try:
                adds[current] += int(parts[0])
                dels[current] += int(parts[1])
            except ValueError:
                pass  # binary files show '-'

    return commits, adds, dels, github


def score(commits: int, adds: int, dels: int) -> float:
    return commits * 10 + adds + dels * 0.5


def fmt_num(n: int) -> str:
    return f"{n:,}"


def build_table(commits, adds, dels, github) -> str:
    authors = sorted(
        commits.keys(),
        key=lambda a: score(commits[a], adds[a], dels[a]),
        reverse=True,
    )

    rows = []
    for rank, author in enumerate(authors, 1):
        c = commits[author]
        a = adds[author]
        d = dels[author]
        s = int(score(c, a, d))
        medal = MEDALS.get(rank, str(rank))

        gh = github.get(author)
        name_cell = f"[{author}](https://github.com/{gh})" if gh else author

        rows.append(
            f"| {medal} | {name_cell} | {fmt_num(c)} | {fmt_num(a)} | {fmt_num(d)} | **{fmt_num(s)}** |"
        )

    updated = date.today().isoformat()
    table = "\n".join([
        START_MARKER,
        "",
        "> 贡献指数 = 提交数 × 10 + 新增行数 + 删除行数 × 0.5 &nbsp;·&nbsp; "
        f"最后更新：{updated}",
        "",
        "| 排名 | 贡献者 | 提交数 | 新增行 | 删除行 | 贡献指数 |",
        "|:----:|--------|-------:|-------:|-------:|-------:|",
        *rows,
        "",
        "_由 GitHub Actions 在每次推送到 main 分支时自动更新_",
        "",
        END_MARKER,
    ])
    return table


def update_readme(table: str, readme_path: str = "README.md") -> None:
    with open(readme_path, encoding="utf-8") as f:
        content = f.read()

    if START_MARKER not in content:
        # Append section at the end
        content = content.rstrip() + "\n\n## 贡献排行榜\n\n" + table + "\n"
    else:
        start = content.index(START_MARKER)
        end   = content.index(END_MARKER) + len(END_MARKER)
        content = content[:start] + table + content[end:]

    with open(readme_path, "w", encoding="utf-8") as f:
        f.write(content)

    print("README.md updated.")


if __name__ == "__main__":
    commits, adds, dels, github = get_stats()
    table = build_table(commits, adds, dels, github)
    update_readme(table)

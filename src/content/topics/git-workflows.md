---
title: Git Workflows
tldr: One branch per change, small commits with real messages, honest merging, and PRs that are easy to review.
category: general
tech: git
order: 55
level: 1
tags: [git, collaboration, version-control]
related: [debugging-method, testing-pyramid]
quiz:
  - q: "A teammate pulled your feature branch yesterday. Today you want to rebase it onto main. Safe?"
    a: "No. Rebase rewrites commits, so your teammate's copy of the branch no longer matches yours. Only rebase branches that nobody else has pulled."
  - q: "A bad commit is already on main and deployed. Reset or revert?"
    a: "Revert. It adds a new commit that undoes the bad one, so shared history stays intact. Reset rewrites history and breaks everyone who already pulled main."
  - q: "Your PR touches 40 files and mixes a bug fix with a new feature. Reviews stall. What went wrong?"
    a: "Two changes share one branch. One branch per change keeps the diff small, and small diffs get reviewed faster and reverted cleanly."
links:
  - title: "Pro Git: Basic Branching and Merging"
    url: https://git-scm.com/book/en/v2/Git-Branching-Basic-Branching-and-Merging
    note: The official book chapter on branching, merging, and conflicts.
  - title: git-rebase documentation
    url: https://git-scm.com/docs/git-rebase
    note: Official reference, including the warning about rebasing shared work.
---

## Analogy

Think of writing a book with an editor. Every chapter gets its own draft pad
(a branch), so a messy chapter never ruins the finished book (main). You hand
the editor one short chapter at a time, not the whole manuscript, because
short drafts get read today and long ones sit for a week.

## The core habits

- **One branch per change.** Main stays deployable. Each fix or feature lives on its own branch, so it can be reviewed, merged, or thrown away alone.
- **Small commits, meaningful messages.** A commit is one logical step. The message says why, not just what: "Limit coupon to one use per customer" beats "fix bug".
- **Merge vs rebase, honestly.** Merge keeps history as it really happened, including a merge commit. Rebase rewrites your commits on top of main for one clean line, which is nicer to read but changes commit ids. Both are fine for your own branch. Never rebase a branch other people have pulled.
- **PR flow.** Open a draft pull request early so people see direction, not a surprise. Small diffs review faster and hide fewer bugs.

## Worked example

Ship a shipping-cost fix without ever touching main directly.

**Step 1: branch off main.** The branch name says what the change is.

```sh
git switch main && git pull
git switch -c fix/free-shipping-threshold
```

**Step 2: commit small, explain why.** One logical change per commit, subject
line in plain words.

```sh
git add src/cart/shipping.ts
git commit -m "Apply free shipping at 50, not 500 (unit bug: cents vs euros)"
```

**Step 3: update your branch.** It is local only, nobody pulled it, so
rebasing onto fresh main is safe and keeps history a straight line.

```sh
git fetch origin
git rebase origin/main
```

**Step 4: open a draft PR early.** Reviewers see the direction while the diff
is still small.

```sh
git push -u origin fix/free-shipping-threshold
gh pr create --draft --title "Fix free shipping threshold" --fill
```

**Step 5: fix mistakes at the right level.** A bad commit that is still only
yours: `reset` it away. A bad commit that others already have: `revert` it.

```sh
git reset --soft HEAD~1   # private mistake: uncommit, keep the work
git revert abc1234        # shared mistake: new commit that undoes it
```

## Try it

Make a throwaway commit on a local branch, then undo it twice: once with
`git reset --soft HEAD~1` and once, after re-committing, with `git revert`.
Compare `git log` after each. (Reset makes the commit vanish; revert leaves
both the mistake and its undo visible.)

## Real use case

An e-commerce store runs a busy checkout. The team keeps main deployable at
all times: every coupon rule, every payment tweak is its own small branch and
PR. When a discount change breaks tax calculation on Black Friday, they revert
one commit in seconds instead of untangling a week of mixed work.

## Gotchas

- Never rebase or force-push a branch someone else has pulled. You rewrite history they are standing on.
- Messages like "fix", "wip", "changes" are useless in six months. Say why the change exists.
- A giant PR does not get a better review, it gets a tired "looks good".
- `git reset --hard` deletes uncommitted work with no undo. Stash or commit first.

## Remember

> One branch per change, one idea per commit. Rebase your own work, merge
> shared work, revert public mistakes.

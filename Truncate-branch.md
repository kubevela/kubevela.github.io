# Truncate gh-pages branch

The branch is going to expand as every commit will trigger new rebuild all websites static files.

We need to Truncate it periodically.


1. Check out to gh-pages and find the latest commit ID.

```
git checkout gh-pages
git pull <upstream> gh-pages
git log
```

2. Assume the commit ID is `COMMIT_ID`

```
git checkout --orphan temp COMMIT_ID
git commit -m "Truncate history"
git rebase --onto temp COMMIT_ID gh-pages
```

3. Force push the Truncated branch.

```
git push origin gh-pages -f
```
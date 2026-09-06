# MyContext — AI向け作業・GitHub引継ぎ

このフォルダはGitリポジトリのルート。別のAIが作業を引き継ぐ際は、以下を確認する。個人の絶対パスに依存せず、このファイルのあるディレクトリで操作する。

## 構成と理論メモリ

- `theory-memory_2030/`: 理論メモリ。編集前に同フォルダの `AGENTS.md` と `00_START.md` を読み、関連論点だけを参照する。更新手順は `50_maintenance/UPDATE.md`。
- `note-speedy_cat_2030-1_md/`: 元記事のローカル資料。理論メモリへの対話追記と原文の改訂を区別する。

## GitHub接続先

2026-09-06確認時点:

- リポジトリ: https://github.com/speedy-cat-2030/observer-measure-theory
- リモート名: `origin`
- 通常のブランチ: `main`
- 追跡先: `origin/main`

作業時は実際の設定を確認し、この記録だけを根拠に接続先やブランチを変更しない。

```powershell
git status --short --branch
git remote -v
git branch --show-current
```

## 保存・コミット・push

1. 変更前に作業ツリーを確認する。他の作業やユーザーの未コミット変更を巻き込まない。
2. 必要なファイルを編集し、差分と関連検査を確認する。理論メモリ更新では同フォルダの更新手順に従う。
3. 自分が変更した対象ファイルだけを明示してステージし、内容が分かるメッセージでコミットする。以下の山括弧部分は実際の値に置き換える。

```powershell
git diff --check
git diff
git add -- <変更したファイルの相対パス>
git diff --cached
git commit -m "<変更内容を表すメッセージ>"
```

4. ユーザーがpushを依頼した場合、または現在の作業について既にpushを許可している場合は、同じ許可を再確認せず進める。単なるローカル保存の依頼を、今後のあらゆる変更を自動pushする恒久的な許可に拡張しない。
5. `main` と `origin` が上記接続先であること、送信する未pushコミットが依頼範囲内であることを確認して実行する。

```powershell
git log --oneline origin/main..HEAD
git push origin main
git status --short --branch
```

6. 成功を確認してから完了を報告する。失敗や競合があれば原因を確認し、強制pushや変更破棄で回避しない。別ブランチの場合はその作業方針に従い、機械的に `main` へ切り替えない。

## 認証

このPCでは2026-09-06に `git push origin main` の成功を確認済み。認証の保管方式はこの記録では特定していない。フォルダを別PCへ移しても認証が引き継がれる保証はない。認証エラー時は利用可能なGit認証手段を確認し、必要ならユーザーにログインを依頼する。トークンやパスワードをこのファイルやリポジトリへ書き込まない。

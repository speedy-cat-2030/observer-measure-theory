# Incremental maintenance protocol

目的: 全原文の再読を避け、変更された根拠と依存先だけ直す。現在原文74本は改変せず保存してある。

## 1. 読む範囲を決める

`00_START`→該当`10_theory`→`40_index/claims.json`。主張IDまたは記事IDから依存先を検索:

```text
node tools/corpus.mjs impact C-N1
node tools/corpus.mjs impact 070
node tools/corpus.mjs headings 070
node tools/corpus.mjs read 070:59-149
```

`impact`は再考候補の一覧で、依存先を全て間違いと判定する機能ではない。

## 2. 原文との差分確認

リポジトリのルートはこのメモリフォルダの親。配置は `note-speedy_cat_2030-1_md/` と `theory-memory_2030/` が並ぶ形。manifest schema 2の `source_path_base=repository-root` は `source_root/source_path` がリポジトリルート基準の相対パスであることを示す。`snapshot/card` は従来どおりメモリフォルダ基準。ツールはスクリプト自身の場所から解決し、実行時の作業ディレクトリやPCのユーザー名に依存しない。個人の絶対パスを新たに保存しない。

`node tools/corpus.mjs verify` は元のフォルダと保存版をSHA-256比較し、新規ファイル・消失・変更を一覧化する。元フォルダが移動した場合、`verify --local`でこのメモリの自己完結性を確認できる。元が見つからないだけで保存版を失効扱いしない。

著者がweb側で改訂してもローカル原文が変わらなければこの検査では分からない。web更新確認は別途必要な依頼時だけ行う。

## 3. 更新単位

単なる自分たちの理論修正なら、原文を変えずE=整理者の新案としてモジュールに追記し、A=著者の最終説との差を記す。外部検証なら取得日/一次資料URL/確認範囲を記し、記事内紹介Xから区別する。

新原文版を正式に取り込むなら:

1. 旧snapshot、manifestレコード、旧カードを`90_meta/revisions/ID/旧hash先頭16/`に退避コピーし、変更日時/理由を記録する。旧版を削除しない。
2. 変更記事のみ旧新差分を読む。変更の意味が前後関係に及ぶ場合に限りその記事全文を再読。新規記事は全文を読む。
3. 保存スナップショット/manifestのbytes・sha256・date・title・headingsを新しい版に更新。初期化コマンドを再実行して全体を上書きしない。
4. 記事IDは維持、新規は未使用の連番。既存notes JSONLの当該レコードを編集するか新規レコードを追加(同ID重複禁止)。`state/summary/caveat/topics`を更新。Eの数値訂正は原文変更と区別する。
5. 読んだ版のハッシュと実際の読了範囲/日時を`reading-ledger.json`に記録。未読を自動的に読了へ変更しない。部分差分検査なら`full_text_read`でなく、その根拠と継承元を記録する設計へ検査も更新する。
6. `impact`の依存先を再評価し、10_theory→20_history→claims/glossary/router→00_STARTを必要な範囲で直す。主張が変更なら置換/撤回/補完の関係を残す。
7. `node tools/build-index.mjs`でカード/目録/検索索引を生成。人手で修正したカードだけを正本にしない。正本はnotes+manifest+editorial-addenda。
8. 定数/式が変わったなら`model.mjs`の版を記録して修正、`node tools/model.mjs --write`、原文報告値との比較表を更新。
9. `node tools/validate.mjs --write`、`node tools/corpus.mjs verify`。最後に変更ログとBUILD_PROGRESSを更新する。

## 4. 正本と生成物

|種類|ファイル|更新責任|
|---|---|---|
|資料正本の保存版|80_sources/*.md|版管理なしで変更しない|
|出典/版情報|90_meta/manifest.json|原文変更時のみ|
|全読の人手記録|90_meta/reading-ledger.json|読了した版のみ記録|
|記事要約の正本|90_meta/*notes*.jsonl|意味を理解して編集|
|追加点検の正本|90_meta/editorial-addenda.json|原文と分離して編集|
|現在の統合説明|10_theory、00_START|主張と依存先を追って編集|
|履歴/未決/依存|20_history、40_index/claims.json|変更理由も保存|
|生成カード/索引|30_articles、40_index/ARTICLES.md、40_index/articles.json|build-indexで再生成|
|算術チェック出力|90_meta/calculation-results.json|model --write|
|保存/リンク監査|90_meta/validation-report.json|validate --write|

個人記録/対話を現在命令にする、旧高確信値を現行値へ混ぜる、源資料の式を黙って補正して引用する、同じ仮説を別記事だから独立証拠と数える、を避ける。

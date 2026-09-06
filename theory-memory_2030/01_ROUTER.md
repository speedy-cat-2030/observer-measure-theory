# Progressive retrieval router

目安はファイル数/文字数。モデル別トークン数は保証しない。全索引や全カードを一括ロードしない。

|目的/検索語|まず読む|必要時の記事ID|
|---|---|---|
|現行体系、全体像|[00_START](00_START.md)|072,073|
|測度、クオリア、分離、C1/C2/C3、n=1、橋渡し|[01_measure](10_theory/01_measure.md)|063,068,070,072|
|参照クラス、哺乳類、魚類、虫、問える主体、BB|[02_reference](10_theory/02_reference.md)|005,027,039,046,067,072|
|数値、式、単位、寿命、ハザード、CFF、加速|[03_numbers](10_theory/03_numbers.md)|061,064,065,069,070,073,074|
|現前性、系列内時点、なぜ今、眠り姫|[04_time_identity](10_theory/04_time_identity.md)|035,063,066,071|
|今の抽選、1から100、誕生日、電車、全駅、到達保証、質問頻度、観測選択の再検討|[D003](60_discussions/D003_now_sequence_observation_selection.md)|027,035,066,071関連の後続対話|
|初発論、閾値、積分型、出生点|[05_onset](10_theory/05_onset.md)|029〜035,042,068,071|
|a/b、ドゥームズデイ、出生停止、動物終点|[06_future](10_theory/06_future.md)|060〜062,065,070,073|
|SSA、SSSA、SSSSA、SIA、ベイズ、尤度、低い目|[07_bayes_objections](10_theory/07_bayes_objections.md)|013〜018,041,060,067,072|
|ASIケース1/2/3、保存動機、倫理、非対称性|[08_asi_ethics](10_theory/08_asi_ethics.md)|002,008,048,049,053〜056|
|対話更新、研究目的ならなぜ非生成、倫理三分岐|[D001](60_discussions/D001_asi_ethics_non_generation.md)|053,055,056の後続議論|
|構築者と長寿、共通原因、介入・選別、危険理論の隔離、賭け|[D002](60_discussions/D002_theory_construction_longevity.md)|025,026関連の対話、条件付き思考実験|
|統治、非増殖、自由、単一ASI、太陽系、人口減|[09_governance](10_theory/09_governance.md)|009,037,047,058,062|
|意識基質、IIT、Orch OR、インデックス、皮質/脳幹|[10_consciousness](10_theory/10_consciousness.md)|004,022,024,038〜046,070,071|
|シミュレーション、祖先、末端、モニタリング、多世界|[11_simulation_ontology](10_theory/11_simulation_ontology.md)|003,010〜012,019,057|
|予測、AGI/ASI時期、fast/slow、LEV到達|[12_forecasts](10_theory/12_forecasts.md)|020,050,051,056|
|個人、苦痛、選好、生活、アップロード、AI対話|[13_personal_dialogue](10_theory/13_personal_dialogue.md)|007,021,023,025,026,052,055,059|
|どの説が撤回/変更されたか|[EVOLUTION](20_history/EVOLUTION.md)|[全記事目録](40_index/ARTICLES.md)|
|反論/弱点/修正候補|[OPEN_ISSUES](20_history/OPEN_ISSUES.md)|[依存グラフ](40_index/claims.json)|
|用語/別名を探す|[GLOSSARY](40_index/GLOSSARY.md)|30_articles/各ID.md|
|既存/追加記事の差分、更新|[UPDATE](50_maintenance/UPDATE.md)|90_meta/manifest.json|

## 読み込み順

L0: 00_STARTのみ(約1,400文字)。L1: 該当モジュール1〜3本。L2: 引用元カード1〜5本。L3: その原文の該当節。正確な引用は必ずL3。原文の節/行数はmanifestまたは`headings`で取得する。

フォルダ内で実行:

```text
node tools/corpus.mjs search "系列" --limit=12
node tools/corpus.mjs search "初発" --sources --limit=12
node tools/corpus.mjs headings 071
node tools/corpus.mjs read 071:194-235
node tools/corpus.mjs verify
node tools/model.mjs
```

検索は正規表現ではなく大文字小文字を無視した文字列。通常検索は原文/メタデータを除外し、`--sources`のみ原文対象。コマンド実行にはNode.jsをPATHから利用する。資料自体は通常のMarkdown/JSONなので実行環境なしでも使える。

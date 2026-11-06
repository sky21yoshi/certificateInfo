# certificateInfo

## 概要
このプロジェクトは[tmp資格情報一覧](https://docs.google.com/spreadsheets/d/1QcS6NJRvvmveI2H31xNifauDQ1A7nmMyuiGFT3xRgO8/edit?usp=sharing)の資格情報に変更がある場合、CW-ConsultingのSlackの公開チャンネルに変更された資格情報を投稿する機能を実現する。

## 前提条件・必要な設定
- **Google Sheets プラグイン (`antigravity-plugins-official/plugin/gsheets`)**:
  - 対象資格一覧のスプレッドシートはアクセス権限が管理されているため、AIエージェントから直接スプレッドシートの参照や同期・更新を行うには、Antigravity の **Google Sheets プラグイン** を追加し、対象シートへのアクセス権を持つ Google アカウントでサインイン（連携）する必要があります。

## 取得元
- IPA: [新着情報](https://www.ipa.go.jp/shiken/index.html)
- AWS: [AWS Training and Certification Blog](https://aws.amazon.com/jp/blogs/training-and-certification/feed/)
- AWS_EN: [AWS Training and Certification Blog](https://aws.amazon.com/blogs/training-and-certification/feed/)
- MICROSOFT: [MICROSOFT API CATALOG](https://learn.microsoft.com/api/catalog/)
- LPI: [Linux Professional Institute (LPI)](https://www.lpi.org/feed/)
- LINUC: [お知らせ](https://linuc.org/news/)
- Cisco: [Learn with Cisco 公式RSS](https://blogs.cisco.com/learning/feed)
- Google Cloud: [Training and Certifications 公式記事一覧](https://cloud.google.com/blog/products/training-certifications)
- Oracle: [Oracle Certification 公式告知](https://www.oracle.com/education/certification/)
- Broadcom / VMware: [VMware Certification](https://www.broadcom.com/support/education/vmware/certification)
- CompTIA: [CompTIA Japan Blog](https://www.comptia.org/ja-jp/blog/)
- CNCF / Linux Foundation: [CNCF Blog](https://www.cncf.io/blog/)・[Linux Foundation Education Blog](https://training.linuxfoundation.org/blog/)
- Anthropic: [Claude Academy Courses](https://academy.claude.com/courses)
- UiPath: [UiPath Certification](https://www.uipath.com/ja/learning/certification)
- サーティファイ: [C言語プログラミング能力認定試験](https://www.sikaku.gr.jp/js/cp/)
- Pythonエンジニア育成推進協会: [お知らせRSS](https://pythonic-exam.com/feed/)・[基礎試験](https://www.pythonic-exam.com/exam/basic)・[データ分析試験](https://www.pythonic-exam.com/exam/data-analyst)
- 日本プロジェクトマネジメント協会 (PMAJ): [PMC](https://www.pmaj.or.jp/p2m/exam/pmc/top.html)・[PMS](https://www.pmaj.or.jp/p2m/exam/pms/top.html)・[PMR](https://www.pmaj.or.jp/p2m/exam/pmr/top.html)

記事URLを一意キーとして監視し、記事一覧がない資格ページはページ内容の指紋を前回状態と比較して更新を検知します。Node.js版では `node src/index.js --provider=broadcom`、`--provider=comptia`、`--provider=cncf`、`--provider=anthropic`、`--provider=uipath`、`--provider=certify`、`--provider=python_association`、`--provider=pmaj` で個別実行できます。テストは `node test/additional_fetchers.test.js` と `node test/new_providers.test.js` で実行します。

Anthropicは資格告知専用ページを確認できなかったため、公式Claude Academyのコース一覧を監視対象としています。
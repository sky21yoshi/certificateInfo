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

各取得元の記事URLを一意キーとして既存の差分検知・状態保存に追加します。Node.js版では `node src/index.js --provider=cisco`、`--provider=google_cloud`、`--provider=oracle` で個別実行できます。テストは `node test/additional_fetchers.test.js` で実行します。

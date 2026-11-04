# certificateInfo

## 概要
このプロジェクトは[【公開版】対象資格一覧](https://docs.google.com/spreadsheets/d/1tZbstgdxA83mrdE6w41AwAfezmEVsAELs0PGDdrQQGg/edit?usp=drive_link)の資格情報に変更がある場合、CW-ConsultingのSlackの公開チャンネルに変更された資格情報を投稿する機能を実現する。

## 前提条件・必要な設定
- **Google Sheets プラグイン (`antigravity-plugins-official/plugin/gsheets`)**:
  - 対象資格一覧のスプレッドシートはアクセス権限が管理されているため、AIエージェントから直接スプレッドシートの参照や同期・更新を行うには、Antigravity の **Google Sheets プラグイン** を追加し、対象シートへのアクセス権を持つ Google アカウントでサインイン（連携）する必要があります。


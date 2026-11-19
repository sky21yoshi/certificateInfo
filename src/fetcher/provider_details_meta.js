/**
 * 全認定機関の資格詳細メタデータ定義 (I列〜P列)
 * 
 * 対象:
 * - LPI / LPI-Japan (No 73〜79)
 * - Oracle (No 80〜86)
 * - Broadcom / VMware (No 87〜90)
 * - CompTIA (No 91〜103)
 * - CNCF / Linux Foundation (No 104〜107)
 * - Anthropic (No 108〜111)
 * - UiPath (No 112〜115)
 * - サーティファイ (No 116〜118)
 * - Pythonエンジニア育成推進協会 (No 119〜120)
 * - PMAJ (No 121〜123)
 * - PMI (No 124)
 * - ISACA (No 125)
 * - PeopleCert (No 126)
 * - Fortinet (No 127)
 * - Palo Alto Networks (No 128)
 * - NTTデータ / NTT-AT (No 129〜130)
 */

const PROVIDER_DETAILS_META = {
  // --- LPI & LPI-Japan ---
  'lpic-1': {
    category: 'Linux Professional Institute Certification (Level 1)',
    examDuration: '101試験: 90分、102試験: 90分',
    examFormat: 'コンピュータベース試験（CBT）、各60問（単一選択、複数選択、穴埋め入力）',
    cost: '各試験 16,500円（税込、2試験合計 33,000円）',
    testingOptions: 'ピアソンVUE テストセンターまたは OnVUE オンライン監督試験',
    introduction: 'LPIC-1は、Linuxの基本操作、システム管理、ネットワーキングの基礎スキルを認定するエントリーレベルの国際資格です。Linuxディストリビューションに依存しない実務能力を証明します。',
    examContent: 'システムアーキテクチャ、Linuxのインストールとパッケージ管理、GNUおよびUNIXコマンド、ファイル・ファイルシステム、シェル・スクリプト、データ管理、インターフェイスとディスプレイ、管理タスク、基本的なシステムサービス、ネットワークの基礎、セキュリティ。',
    contentOutline: '【出題分野】101試験: 1.0 システムアーキテクチャ、2.0 Linuxのインストールとパッケージ管理、3.0 GNUおよびUNIXコマンド、4.0 デバイス、Linuxファイルシステム、ファイルシステム階層標準。102試験: 1.0 シェル、スクリプト、データ管理、2.0 ユーザインターフェイスとデスクトップ、3.0 管理業務、4.0 必須システムサービス、5.0 ネットワーキングの基礎、6.0 セキュリティ。',
  },
  'lpic-2': {
    category: 'Linux Professional Institute Certification (Level 2)',
    examDuration: '201試験: 90分、202試験: 90分',
    examFormat: 'コンピュータベース試験（CBT）、各60問（単一選択、複数選択、穴埋め入力）',
    cost: '各試験 16,500円（税込、2試験合計 33,000円）',
    testingOptions: 'ピアソンVUE テストセンターまたは OnVUE オンライン監督試験',
    introduction: 'LPIC-2は、小〜中規模の混在ネットワークを管理・運用できる高度なLinuxエンジニアスキルを認定する資格です。上位認定として業界で高く評価されています。',
    examContent: 'キャパシティプランニング、Linuxカーネル、システムの起動、ファイルシステムとデバイス、高度なストレージ管理、ネットワーク構成、システム保守、ドメインネームサーバー（DNS）、Webサービス、ファイル共有、ネットワーククライアント管理、電子メールサービス、システムセキュリティ。',
    contentOutline: '【出題分野】201試験: 1.0 キャパシティプランニング、2.0 Linuxカーネル、3.0 システムの起動、4.0 ファイルシステムとデバイス、5.0 高度なストレージ管理、6.0 ネットワーク構成、7.0 システム保守。202試験: 1.0 ドメインネームサーバー(DNS)、2.0 Webサービス、3.0 ファイル共有、4.0 ネットワーククライアント管理、5.0 電子メールサービス、6.0 システムセキュリティ。',
  },
  'lpic-3': {
    category: 'Linux Professional Institute Certification (Level 3 - 最高峰)',
    examDuration: '90分',
    examFormat: 'コンピュータベース試験（CBT）、約60問',
    cost: '各試験 16,500円（税込）',
    testingOptions: 'ピアソンVUE テストセンターまたは OnVUE オンライン監督試験',
    introduction: 'LPIC-3は、エンタープライズレベルでのLinux専門知識（Mixed Environment, Security, Virtualization & High Availabilityなど）を証明する最高位資格です。',
    examContent: 'エンタープライズレベルの大規模システム設計・構築・セキュリティ強化・クラスタリング・仮想化技術の実装と運用保守。300試験、303試験、305試験などの専門科目から1科目合格で認定。',
    contentOutline: '【専門試験】300試験: 混在環境・Samba/AD連携。303試験: 暗号化・アクセス制御・ネットワークセキュリティ。305試験: 仮想化技術（KVM等）・コンテナ・高可用性クラスタリング。',
  },
  'linuc-1': {
    category: 'クラウド時代のLinux技術者認定（レベル1）',
    examDuration: '101試験: 90分、102試験: 90分',
    examFormat: 'コンピュータベース試験（CBT）、各約60問（多肢選択、キー入力）',
    cost: '各試験 16,500円（税込、2試験合計 33,000円）',
    testingOptions: 'ピアソンVUE テストセンターまたは自宅・職場からのオンライン受験',
    introduction: 'LinuC-1は、仮想化環境やクラウド環境を含むLinuxシステムの基本操作、構築、運用に必要な基礎知識を証明する認定資格です。',
    examContent: '仮想マシン・コンテナの基礎、Linux環境の基本操作、システムアーキテクチャ、パッケージ管理、GNU/UNIXコマンド、デバイスとファイルシステム、ネットワークの基礎、セキュリティ。',
    contentOutline: '【出題範囲】101試験: システムアーキテクチャ、Linuxインストールとパッケージ管理、GNU/UNIXコマンド、デバイス・Linuxファイルシステム。102試験: シェルとスクリプト、ユーザインターフェースとデスクトップ、管理業務、必須システムサービス、ネットワークの基礎、セキュリティ。',
  },
  'linuc-2': {
    category: 'クラウド時代のLinux技術者認定（レベル2）',
    examDuration: '201試験: 90分、202試験: 90分',
    examFormat: 'コンピュータベース試験（CBT）、各約60問',
    cost: '各試験 16,500円（税込、2試験合計 33,000円）',
    testingOptions: 'ピアソンVUE テストセンターまたは自宅・職場からのオンライン受験',
    introduction: 'LinuC-2は、クラウドや仮想化環境におけるLinuxシステム全体の設計・構築・監視・ネットワークサービスの安定運用スキルを認定します。',
    examContent: 'リソース監視・キャパシティプランニング、カーネル運用、システム起動プロセス、ストレージ管理、ネットワーク構成、DNS/Web/ファイル共有等の各種ネットワークサービス構築、セキュリティ対策。',
    contentOutline: '【出題範囲】201試験: キャパシティプランニング、Linuxカーネル、システム起動、ファイルシステム・ストレージ、ネットワーク構成、保守・トラブルシューティング。202試験: ドメインネームサーバ、Webサービス、ファイル共有、クライアント管理、メール、セキュリティ。',
  },
  'linuc-3': {
    category: 'クラウド時代のLinux技術者認定（レベル3 - 最高峰）',
    examDuration: '90分',
    examFormat: 'コンピュータベース試験（CBT）、約60問',
    cost: '16,500円（税込）',
    testingOptions: 'ピアソンVUE テストセンターまたは自宅・職場からのオンライン受験',
    introduction: 'LinuC-3は、大規模エンタープライズシステムやクラウドネイティブ環境の設計・構築・セキュリティ・可用性設計を担うプロフェッショナル向け最高峰認定です。',
    examContent: 'LinuC-3 303（セキュリティ）、304（仮想化と高可用性）など、特定分野における最高レベルの実践的スキルを検証。',
    contentOutline: '【出題範囲】暗号化技術、アクセス制御、侵入検知、仮想化基盤（KVM等）、コンテナオーケストレーション、高可用性クラスタリング、システム耐障害性設計。',
  },
  'html5': {
    category: 'Web技術者認定（レベル1 / レベル2）',
    examDuration: '90分',
    examFormat: 'コンピュータベース試験（CBT）、約60問',
    cost: '16,500円（税込）',
    testingOptions: 'ピアソンVUE テストセンターまたはオンライン受験',
    introduction: 'HTML5プロフェッショナル認定試験は、HTML5、CSS3、JavaScriptなど最新のマークアップおよびWebアプリケーション開発技術力を客観的に証明する認定試験です。',
    examContent: 'HTML5マークアップ、CSS3スタイリング、レスポンシブWebデザイン、Web通信基礎、JavaScriptプログラミング、HTML5 API、パフォーマンスチューニング。',
    contentOutline: '【出題範囲】レベル1: Webの基礎知識、HTML5マークアップ、CSS3、レスポンシブWebデザイン。レベル2: JavaScript言語仕様、ブラウザAPI、グラフィックス・マルチメディア、Webストレージ、通信プロトコル、パフォーマンス最適化。',
  },

  // --- Oracle ---
  'oracle-java-bronze': {
    category: 'Java Certified Associate (Bronze)',
    examDuration: '65分',
    examFormat: 'オンライン試験（多肢選択式）、60問',
    cost: '13,200円（税込）',
    testingOptions: 'オラクルユニバーシティ オンライン監督なし試験（CertView経由）',
    introduction: 'Java言語の基本的な文法やオブジェクト指向プログラミングの基礎知識を証明するエントリーレベルの資格です。日本のIT現場で広く推奨されています。',
    examContent: 'Javaの基本文法、データ型の宣言と使用、演算子と制御構造、オブジェクト指向の基本概念、クラスの定義とインスタンス化、メソッドの作成と呼び出し。',
    contentOutline: '【出題分野】1.0 Java言語のプログラムの流れ、2.0 データの宣言と使用、3.0 演算子と分岐文、4.0 繰り返し文と繰り返し制御文、5.0 オブジェクト指向概念、6.0 クラスの定義とオブジェクトの生成・使用、7.0 継承とポリモーフィズム。',
  },
  'oracle-master-bronze-dba': {
    category: 'ORACLE MASTER Bronze (DBA)',
    examDuration: '120分',
    examFormat: 'CBT試験（多肢選択式）、70問',
    cost: '37,730円（税込）',
    testingOptions: 'ピアソンVUE テストセンターまたはオンライン試験',
    introduction: 'Oracle Databaseのアーキテクチャの基本理解、データベースの日常管理や運用の基本知識を証明するDBAエントリー資格です。',
    examContent: 'リレーショナルデータベースの概念、Oracle Databaseアーキテクチャ、インスタンス管理、ストレージ構造、ユーザーおよびセキュリティ管理、バックアップ/リカバリの基礎。',
    contentOutline: '【出題分野】1.0 Oracle Databaseの基礎、2.0 データベースの作成と構成、3.0 インスタンスの管理、4.0 ネットワーク環境の構成、5.0 データベース記憶領域構造の管理、6.0 ユーザーおよびセキュリティの管理、7.0 データベースの監視とメンテナンスの基礎。',
  },
  'oracle-master-silver-dba': {
    category: 'ORACLE MASTER Silver (Oracle Database)',
    examDuration: '120分',
    examFormat: 'CBT試験（多肢選択式）、72問',
    cost: '37,730円（税込）',
    testingOptions: 'ピアソンVUE テストセンターまたはオンライン試験',
    introduction: '一人前のDBAとして、Oracle Databaseの運用・保守・トラブルシューティング、バックアップとリカバリの実践スキルを証明します。国際資格OCAにも対応。',
    examContent: 'データベースアーキテクチャ、データベース構成と管理、バックアップおよびリカバリ戦略の実装、障害診断、パフォーマンス監視。',
    contentOutline: '【出題分野】1.0 データベースアーキテクチャと管理概要、2.0 CDBおよびPDBの管理、3.0 バックアップおよびリカバリの概念と実行(RMAN)、4.0 データベース障害の診断、5.0 パフォーマンスの監視とチューニングの基本、6.0 領域管理とストレージ最適化。',
  },
  'oracle-java-silver': {
    category: 'Oracle Certified Java Programmer (Silver)',
    examDuration: '90分',
    examFormat: 'CBT試験（多肢選択式）、50問',
    cost: '37,730円（税込）',
    testingOptions: 'ピアソンVUE テストセンターまたはオンライン試験',
    introduction: 'Java開発者として必要なプログラミングスキル、言語仕様の深い理解、オブジェクト指向設計の実装力を認定する国際資格です。Java SE 11に対応。',
    examContent: 'データ型・演算子、制御構文、オブジェクト指向アプローチ、例外処理、コアAPI（String, コレクション, ラムダ式）、モジュールシステム。',
    contentOutline: '【出題分野】1.0 Javaの基本データ型と文字列操作、2.0 演算子と制御構造、3.0 クラスとオブジェクトの操作、4.0 継承とインターフェース、5.0 例外処理、6.0 ラムダ式と関数型インターフェース、7.0 モジュールシステムの基礎。',
  },
  'oracle-master-gold-dba': {
    category: 'ORACLE MASTER Gold (OCP)',
    examDuration: '120分',
    examFormat: 'CBT試験（多肢選択式）、68問',
    cost: '37,730円（税込）',
    testingOptions: 'ピアソンVUE テストセンターまたはオンライン試験',
    introduction: 'データベース管理者として、高度なバックアップ・リカバリ設計、マルチテナントアーキテクチャの高度運用、パフォーマンスチューニングができることを証明します。',
    examContent: 'マルチテナントアーキテクチャの完全な管理、RMANによる高度な障害復旧、Oracle Flashback技術、監査とデータ暗号化、リソースマネージャ。',
    contentOutline: '【出題分野】1.0 マルチテナントアーキテクチャの高度な管理、2.0 バックアップおよびリカバリ戦略の最適化(RMAN高度機能)、3.0 フラッシュバック技術、4.0 データの移動および移行、5.0 データベース監査とセキュリティ暗号化、6.0 リソースマネージャの構成。',
  },
  'oracle-java-gold': {
    category: 'Oracle Certified Java Programmer (Gold)',
    examDuration: '90分',
    examFormat: 'CBT試験（多肢選択式）、80問',
    cost: '37,730円（税込）',
    testingOptions: 'ピアソンVUE テストセンターまたはオンライン試験',
    introduction: 'Java言語の全機能を駆使し、堅牢でスケーラブルなエンタープライズアプリケーションを設計・実装できる高度開発者資格です。',
    examContent: 'ジェネリクスとコレクション、Stream APIとラムダ式、並行処理（マルチスレッド）、I/O・NIO.2、JDBCによるDBアクセス、ローカライゼーション、セキュリティ。',
    contentOutline: '【出題分野】1.0 オブジェクト指向の高度な設計原則、2.0 ジェネリクスと関数型インターフェース、3.0 Stream APIによるデータ処理、4.0 例外とアサーション、5.0 並行処理とマルチスレッド、6.0 I/OおよびNIO.2、7.0 JDBCによるデータベース操作、8.0 安全なコーディング技術。',
  },
  'oracle-master-platinum': {
    category: 'ORACLE MASTER Platinum (最高峰)',
    examDuration: '2日間（実技実技ラボ試験）',
    examFormat: '実技試験（ハンズオン実機環境でのトラブルシューティングおよびシステム構築）',
    cost: '250,000円〜（税込）',
    testingOptions: 'オラクル公認実技試験会場',
    introduction: 'Oracle Databaseにおける最高峰の称号であり、ミッションクリティカルな大規模データベースの設計、高可用性（Data Guard/RAC）構築、障害復旧を完遂できるエキスパートを認定します。',
    examContent: 'データベースとネットワーク構成、Oracle Grid InfrastructureとRACの導入・構成、Data Guardによるディザスタリカバリ環境構築、パフォーマンスチューニング、RMANバックアップと高度リカバリ。',
    contentOutline: '【実技分野】1.0 データベース構築と基本構成、2.0 Grid InfrastructureおよびOracle RACの構築と管理、3.0 Oracle Data Guard環境の導入・運用、4.0 データベースパフォーマンスの監視とチューニング、5.0 高度なバックアップ・リストア・障害復旧シナリオの実践。',
  },

  // --- Broadcom (旧 VMware) ---
  'broadcom-vcp': {
    category: 'Professional',
    examDuration: '130分',
    examFormat: 'CBT多肢選択式（約70問）',
    cost: '250 USD（約37,500円）',
    testingOptions: 'ピアソンVUE テストセンターまたはオンライン（OnVUE）',
    introduction: 'VMware vSphere環境のインストール、構成、管理、最適化を独立して行えるエンジニアを認定する中核資格です。',
    examContent: 'VMware vSphereアーキテクチャ、vCenter ServerおよびESXiホストの構成、vSphere標準・分散スイッチのネットワーク、VMFS/vSANストレージ、仮想マシン管理、vSphereクラスタ（HA/DRS）の導入・保守。',
    contentOutline: '【出題分野】1.0 アーキテクチャとテクノロジー、2.0 VMware製品とソリューション、3.0 vSphereのインストール、構成、セットアップ、4.0 パフォーマンスの調整・最適化、5.0 管理および運用タスク、6.0 トラブルシューティング。',
  },
  'broadcom-vcap': {
    category: 'Advanced Professional',
    examDuration: 'Design試験: 135分、Deploy試験: 205分',
    examFormat: 'Design試験（多肢選択・ドラッグ&ドロップ）または Deploy試験（実技ラボ操作試験）',
    cost: '各試験 450 USD（約67,500円）',
    testingOptions: 'ピアソンVUE テストセンターまたはオンライン',
    introduction: '大規模エンタープライズ向けのVMware仮想化インフラの高度な設計（Design）およびハンズオン展開・運用（Deploy）能力を認定します。',
    examContent: '要件分析・概念/論理/物理設計、高度なvSphere/vSAN/NSX機能の実装、CLI/APIによる自動化、高度なパフォーマンストラブルシューティング。',
    contentOutline: '【出題分野】Design: 1.0 概念設計の作成、2.0 論理設計の作成、3.0 物理設計の作成。Deploy: 1.0 vSphere環境の展開・管理、2.0 高度なネットワーク・ストレージ構成、3.0 障害復旧とセキュリティ強化の実機実装。',
  },
  'broadcom-vcdx': {
    category: 'Expert（最高峰）',
    examDuration: '設計書提出＋審査員による口頭試問（ディフェンス）',
    examFormat: '本格的な本番システム設計書の審査、および面接・プレゼンテーションによる防衛口頭試問',
    cost: '設計書審査料 995 USD + ディフェンス審査料 3,000 USD',
    testingOptions: 'Broadcom審査会場またはリモート審査パネル',
    introduction: '仮想化業界最高峰の資格であり、ミッションクリティカルな大規模エンタープライズ基盤のアーキテクチャ設計・統括ができる世界トップレベルの技術者に授与されます。',
    examContent: '実際の顧客要件に基づく完全な仮想化基盤設計書の作成、審査員（VCDXパネル）の前での設計意図のプレゼンテーション、および突発的なトラブル対応シナリオへの質疑応答。',
    contentOutline: '【評価分野】1.0 ビジネス要件の分析とアーキテクチャへの反映、2.0 可用性・管理容易性・パフォーマンス・リカバリ可能性・セキュリティの設計検証、3.0 実践的な設計防御プレゼンテーションとシナリオ質疑応答。',
  },
  'broadcom-vcta': {
    category: 'Technical Associate (Entry)',
    examDuration: '90分',
    examFormat: 'CBT多肢選択式（約50問）',
    cost: '125 USD（約18,500円）',
    testingOptions: 'ピアソンVUE オンライン監督試験またはテストセンター',
    introduction: '仮想化の基本概念、VMware製品群の基礎、日常的な仮想マシン管理タスクを実行できる初級エンジニア向け認定です。',
    examContent: '仮想化の基礎知識、vSphereのコンポーネント概要、仮想マシンの作成と設定、基本的なストレージとネットワーク、監視機能の利用。',
    contentOutline: '【出題分野】1.0 仮想化およびvSphereの基本概念、2.0 vSphereコンポーネントの識別、3.0 基本的な仮想マシン操作とテンプレート、4.0 リソース監視とアラーム確認。',
  },

  // --- CompTIA ---
  'comptia-itf': {
    category: 'Core / Foundational',
    examDuration: '60分',
    examFormat: '多肢選択式、75問',
    cost: '18,700円（税込）',
    testingOptions: 'ピアソンVUE テストセンターまたはオンライン（OnVUE）',
    introduction: 'ITの基礎概念、ハードウェア、ソフトウェア、ネットワーク、セキュリティ、データベースの基礎を包括的にカバーする入門資格です。',
    examContent: 'ITインフラ、ソフトウェア開発の基礎、データベースの基礎、セキュリティの基礎、トラブルシューティング。',
    contentOutline: '【出題分野】1.0 ITの概念と用語 (17%)、2.0 インフラストラクチャ (22%)、3.0 アプリケーションとソフトウェア (18%)、4.0 ソフトウェア開発 (12%)、5.0 データベースの基礎 (11%)、6.0 セキュリティ (20%)。',
  },
  'comptia-a': {
    category: 'Core',
    examDuration: 'Core 1: 90分、Core 2: 90分',
    examFormat: '多肢選択式およびパフォーマンスベーステスト（PBT）、最大各90問',
    cost: '各試験 36,960円（税込、2試験合計 73,920円）',
    testingOptions: 'ピアソンVUE テストセンターまたはオンライン',
    introduction: 'PCハードウェア、モバイルデバイス、OS、ネットワーク、セキュリティ、クラウドのトラブルシューティングを担うサポート技術者の業界標準資格です。',
    examContent: 'Core 1 (220-1101): モバイルデバイス、ネットワーキング技術、ハードウェア、仮想化とクラウド。Core 2 (220-1102): OSのインストールと構成、セキュリティ、ソフトウェアトラブルシューティング、運用手順。',
    contentOutline: '【出題分野】Core 1: モバイル(15%)、ネットワーク(20%)、ハードウェア(25%)、仮想化/クラウド(11%)、トラブルシューティング(29%)。Core 2: OS(31%)、セキュリティ(25%)、ソフトウェアトラブルシューティング(22%)、運用手順(22%)。',
  },
  'comptia-network': {
    category: 'Core / Infrastructure',
    examDuration: '90分',
    examFormat: '単一・複数選択式およびパフォーマンスベーステスト（PBT）、最大90問',
    cost: '49,500円（税込）',
    testingOptions: 'ピアソンVUE テストセンターまたはオンライン',
    introduction: 'ベンダーニュートラルなネットワーク設計、構成、管理、トラブルシューティングスキルを網羅する中級ネットワーク認定です。',
    examContent: 'ネットワーク概念、ネットワーク実装、ネットワーク運用、ネットワークセキュリティ、ネットワークトラブルシューティング。',
    contentOutline: '【出題分野】1.0 ネットワークの概念 (23%)、2.0 ネットワークの実装 (19%)、3.0 ネットワークの運用 (16%)、4.0 ネットワークセキュリティ (19%)、5.0 ネットワークのトラブルシューティング (23%)。',
  },
  'comptia-security': {
    category: 'Core / Cybersecurity',
    examDuration: '90分',
    examFormat: '単一・複数選択式およびパフォーマンスベーステスト（PBT）、最大90問',
    cost: '55,440円（税込）',
    testingOptions: 'ピアソンVUE テストセンターまたはオンライン',
    introduction: 'セキュリティ実務担当者として不可欠なベースラインスキルを証明する、グローバルで最も認知されているセキュリティ資格です。',
    examContent: '一般的なセキュリティ概念、脅威・脆弱性・インシデントへの対策、セキュリティアーキテクチャ、セキュリティ運用、セキュリティプログラム管理・ガバナンス。',
    contentOutline: '【出題分野】1.0 一般的なセキュリティの概念 (12%)、2.0 脅威、脆弱性、および対策 (22%)、3.0 セキュリティアーキテクチャ (18%)、4.0 セキュリティ運用 (28%)、5.0 セキュリティプログラム管理および監視 (20%)。',
  },
  'comptia-cloud': {
    category: 'Infrastructure',
    examDuration: '90分',
    examFormat: '多肢選択式およびパフォーマンスベーステスト、最大90問',
    cost: '49,500円（税込）',
    testingOptions: 'ピアソンVUE テストセンターまたはオンライン',
    introduction: 'マルチクラウド環境におけるインフラ構築、サービス移行、セキュリティ、最適化、トラブルシューティングスキルを評価します。',
    examContent: 'クラウドアーキテクチャ、クラウドセキュリティ、クラウド展開、運用・サポート、トラブルシューティング。',
    contentOutline: '【出題分野】1.0 クラウドアーキテクチャ (13%)、2.0 セキュリティ (20%)、3.0 展開 (23%)、4.0 運用とサポート (22%)、5.0 トラブルシューティング (22%)。',
  },
  'comptia-linux': {
    category: 'Infrastructure',
    examDuration: '90分',
    examFormat: '多肢選択式およびパフォーマンスベーステスト、最大90問',
    cost: '49,500円（税込）',
    testingOptions: 'ピアソンVUE テストセンターまたはオンライン',
    introduction: 'Linuxサーバーの導入、運用保守、コマンドライン管理、セキュリティ、コンテナや自動化を含む包括的スキルを評価します。',
    examContent: 'システム管理、セキュリティ、Linuxのトラブルシューティング・診断、自動化・スクリプト作成。',
    contentOutline: '【出題分野】1.0 システム管理 (32%)、2.0 セキュリティ (21%)、3.0 スクリプト、コンテナ、自動化 (19%)、4.0 トラブルシューティング (28%)。',
  },
  'comptia-server': {
    category: 'Infrastructure',
    examDuration: '90分',
    examFormat: '多肢選択式、最大90問',
    cost: '49,500円（税込）',
    testingOptions: 'ピアソンVUE テストセンターまたはオンライン',
    introduction: 'データセンターやオンプレミス・クラウド環境におけるサーバーハードウェア、ストレージ、トラブルシューティングを網羅する資格です。',
    examContent: 'サーバーハードウェアのインストール・管理、サーバー管理、セキュリティ、ストレージ、障害復旧。',
    contentOutline: '【出題分野】1.0 サーバーハードウェアのインストールと管理 (18%)、2.0 サーバー管理 (30%)、3.0 セキュリティとディザスタリカバリ (24%)、4.0 トラブルシューティング (28%)。',
  },
  'comptia-casp': {
    category: 'Cybersecurity（最上位）',
    examDuration: '165分',
    examFormat: '多肢選択式およびパフォーマンスベーステスト、最大90問',
    cost: '66,000円（税込）',
    testingOptions: 'ピアソンVUE テストセンターまたはオンライン',
    introduction: '複雑なエンタープライズ環境でセキュアなソリューションを設計・設計監理できる高度セキュリティアーキテクト向け認定です（CompTIA SecurityX）。',
    examContent: 'セキュリティアーキテクチャ、セキュリティ運用、セキュリティエンジニアリング・暗号技術、ガバナンス・リスク・コンプライアンス。',
    contentOutline: '【出題分野】1.0 セキュリティアーキテクチャ (29%)、2.0 セキュリティ運用 (30%)、3.0 セキュリティエンジニアリングおよび暗号技術 (26%)、4.0 ガバナンス、リスク、コンプライアンス (15%)。',
  },
  'comptia-pentest': {
    category: 'Cybersecurity',
    examDuration: '165分',
    examFormat: '多肢選択式およびパフォーマンスベーステスト、最大85問',
    cost: '55,440円（税込）',
    testingOptions: 'ピアソンVUE テストセンターまたはオンライン',
    introduction: 'ペネトレーションテスト（侵入テスト）の計画、スコープ定義、情報収集、攻撃手法、脆弱性報告までの一連の実践スキルを認定します。',
    examContent: '計画とスコープ定義、情報収集と脆弱性スキャン、攻撃とエクスプロイト、報告と伝達、ツールとコード分析。',
    contentOutline: '【出題分野】1.0 計画とスコープ定義 (14%)、2.0 情報収集と脆弱性スキャン (22%)、3.0 攻撃とエクスプロイト (30%)、4.0 レポーティングとコミュニケーション (18%)、5.0 ツールとコード分析 (16%)。',
  },
  'comptia-project': {
    category: 'Professional',
    examDuration: '90分',
    examFormat: '多肢選択式、最大90問',
    cost: '49,500円（税込）',
    testingOptions: 'ピアソンVUE テストセンターまたはオンライン',
    introduction: '小〜中規模プロジェクトのライフサイクル管理、スコープ・リソース・スケジュール管理、リスクマネジメントスキルを認定します。',
    examContent: 'プロジェクトの基礎、プロジェクトの制約、リソースと調達、プロジェクトの進捗と品質、変更管理とコミュニケーション。',
    contentOutline: '【出題分野】1.0 プロジェクトの基礎 (28%)、2.0 プロジェクトの制約 (20%)、3.0 コミュニケーションと変更管理 (24%)、4.0 プロジェクトツールとドキュメント (28%)。',
  },
  'comptia-ctt': {
    category: 'Training / Education',
    examDuration: '筆記試験: 90分、実技審査: 模擬講義ビデオ提出',
    examFormat: '多肢選択式（95問）および実技ビデオ提出審査',
    cost: '筆記 44,000円 + 実技審査 48,400円',
    testingOptions: 'ピアソンVUE テストセンター（筆記）およびオンライン提出（実技）',
    introduction: 'ITおよび技術教育のプロフェッショナルインストラクターとして、優れた指導技法とコミュニケーション能力を証明します。',
    examContent: 'コース準備、効果的な指導手法、学習者との対話とファシリテーション、評価とフィードバック。',
    contentOutline: '【出題分野】1.0 コースの計画と準備、2.0 指導方法とメディア、3.0 インストラクターの信頼性とコミュニケーション、4.0 グループのファシリテーション、5.0 学習成果の評価。',
  },
  'comptia-cloud-essentials': {
    category: 'Foundational / Business',
    examDuration: '60分',
    examFormat: '多肢選択式、最大75問',
    cost: '18,700円（税込）',
    testingOptions: 'ピアソンVUE テストセンターまたはオンライン',
    introduction: 'クラウドの基礎原理、ビジネス面および技術面のメリット・リスク、クラウド導入戦略の判断基準を理解していることを証明します。',
    examContent: 'クラウドの概念、ビジネスの原則、運用の優先順位、ガバナンス・リスク・コンプライアンス。',
    contentOutline: '【出題分野】1.0 クラウドの概念 (24%)、2.0 ビジネス原則 (21%)、3.0 管理と運用 (25%)、4.0 ガバナンス、リスク、コンプライアンス (30%)。',
  },
  'comptia-cysa': {
    category: 'Cybersecurity',
    examDuration: '165分',
    examFormat: '多肢選択式およびパフォーマンスベーステスト、最大85問',
    cost: '55,440円（税込）',
    testingOptions: 'ピアソンVUE テストセンターまたはオンライン',
    introduction: 'セキュリティの振る舞い分析、継続的なセキュリティ監視、脅威インテリジェンス、インシデントレスポンスの実践能力を証明します。',
    examContent: 'セキュリティオペレーション、脆弱性管理、インシデント対応と管理、レポーティングとコミュニケーション。',
    contentOutline: '【出題分野】1.0 セキュリティオペレーション (33%)、2.0 脆弱性管理 (30%)、3.0 インシデント対応と管理 (20%)、4.0 レポーティングとコミュニケーション (17%)。',
  },
  'comptia-data': {
    category: 'Data and Analytics',
    examDuration: '90分',
    examFormat: '多肢選択式、最大90問',
    cost: '49,500円（税込）',
    testingOptions: 'ピアソンVUE テストセンターまたはオンライン',
    introduction: 'データ駆動型のビジネス意思決定を促進するために、データ分析、統計概念の適用、データの可視化とレポーティング能力を認定します。',
    examContent: 'データマイニング、データ操作、データの可視化、データガバナンスとセキュリティ。',
    contentOutline: '【出題分野】1.0 データの概念と環境 (12%)、2.0 データマイニング (22%)、3.0 データ分析 (24%)、4.0 可視化 (23%)、5.0 データガバナンス・品質・管理 (19%)。',
  },
  'comptia-datasys': {
    category: 'Data and Analytics',
    examDuration: '90分',
    examFormat: '多肢選択式、最大90問',
    cost: '49,500円（税込）',
    testingOptions: 'ピアソンVUE テストセンターまたはオンライン',
    introduction: 'リレーショナルデータベースの設計、保守、セキュリティ、障害復旧など、データベース管理・運用に不可欠な基礎スキルを証明します。',
    examContent: 'データベース構造、データベース運用、セキュリティとコンプライアンス、トラブルシューティング。',
    contentOutline: '【出題分野】1.0 データベース構造とツール (28%)、2.0 データベース運用 (27%)、3.0 セキュリティとコンプライアンス (26%)、4.0 データベースのトラブルシューティング (19%)。',
  },

  // --- CNCF / Linux Foundation ---
  'cncf-cka': {
    category: 'Kubernetes Certification (Administrator)',
    examDuration: '2時間（120分）',
    examFormat: '実技試験（オンライン監督下のハンズオン実機操作、15〜20問）',
    cost: '395 USD（約59,000円、日本語版 CKA-JP）',
    testingOptions: 'オンライン監督付きリモート受験（ブラウザベースのLinux端末環境）',
    introduction: 'Kubernetesクラスタのインストール、構成、ネットワーク、ストレージ、トラブルシューティングを実機で完遂できる管理者認定です。',
    examContent: 'ストレージ (10%)、トラブルシューティング (30%)、ワークロードとスケジューリング (15%)、クラスタのアーキテクチャ・導入・保守 (25%)、サービスとネットワーキング (20%)。',
    contentOutline: '【出題分野】1.0 クラスタのアーキテクチャ、インストール、保守 (25%)、2.0 ワークロードとスケジューリング (15%)、3.0 サービスとネットワーキング (20%)、4.0 ストレージ (10%)、5.0 トラブルシューティング (30%)。',
  },
  'cncf-ckad': {
    category: 'Kubernetes Certification (Developer)',
    examDuration: '2時間（120分）',
    examFormat: '実技試験（オンライン監督下のハンズオン実機操作）',
    cost: '395 USD（約59,000円、日本語版 CKAD-JP）',
    testingOptions: 'オンライン監督付きリモート受験',
    introduction: 'Kubernetes向けクラウドネイティブアプリケーションの設計、ビルド、デプロイ、監視・構成管理を実機で実証する開発者資格です。',
    examContent: 'アプリケーション設計とビルド (20%)、アプリケーションのデプロイ (20%)、アプリケーションの可観測性と保守 (20%)、環境設定とセキュリティ (25%)、サービスとネットワーキング (15%)。',
    contentOutline: '【出題分野】1.0 アプリケーションの設計とビルド (20%)、2.0 アプリケーションのデプロイ (20%)、3.0 アプリケーションの可観測性と保守 (20%)、4.0 環境、設定、セキュリティ (25%)、5.0 サービスとネットワーキング (15%)。',
  },
  'cncf-cks': {
    category: 'Kubernetes Certification (Security)',
    examDuration: '2時間（120分）',
    examFormat: '実技試験（オンライン監督下のハンズオン実機操作、事前CKA合格必須）',
    cost: '395 USD（約59,000円、日本語版 CKS-JP）',
    testingOptions: 'オンライン監督付きリモート受験',
    introduction: 'ビルド、デプロイ、実行時の各フェーズにおいて、Kubernetesクラスタおよびクラウドネイティブ環境を保護する高度セキュリティ資格です。',
    examContent: 'クラスタ設定 (10%)、クラスタのハードニング (15%)、システムのハードニング (15%)、マイクロサービスの脆弱性最小化 (20%)、サプライチェーンセキュリティ (20%)、監視・監査・実行時セキュリティ (20%)。',
    contentOutline: '【出題分野】1.0 クラスタ設定 (10%)、2.0 クラスタのハードニング (15%)、3.0 システムのハードニング (15%)、4.0 マイクロサービスの脆弱性最小化 (20%)、5.0 サプライチェーンセキュリティ (20%)、6.0 監視・ロギング・実行時セキュリティ (20%)。',
  },
  'cncf-kcna': {
    category: 'Cloud Native Associate (Entry)',
    examDuration: '90分',
    examFormat: '多肢選択式（60問）',
    cost: '250 USD（約37,500円、日本語版 KCNA-JP）',
    testingOptions: 'オンライン監督付きリモート受験',
    introduction: 'Kubernetesおよびクラウドネイティブエコシステム（CNCFランドスケープ）の基礎概念とアーキテクチャを理解していることを証明します。',
    examContent: 'Kubernetesの基礎 (46%)、コンテナオーケストレーション (22%)、クラウドネイティブアーキテクチャ (16%)、クラウドネイティブの可観測性 (8%)、クラウドネイティブアプリケーション配信 (8%)。',
    contentOutline: '【出題分野】1.0 Kubernetesの基礎 (46%)、2.0 コンテナオーケストレーション (22%)、3.0 クラウドネイティブアーキテクチャ (16%)、4.0 クラウドネイティブの可観測性 (8%)、5.0 クラウドネイティブアプリケーションの配信 (8%)。',
  },

  // --- Anthropic ---
  'anthropic-ccao-f': {
    category: 'Foundations',
    examDuration: '60分',
    examFormat: 'オンライン選択式（約50問）',
    cost: '100 USD（約15,000円）',
    testingOptions: 'オンライン監督付き試験',
    introduction: 'Claudeの基本機能、プロンプトエンジニアリングの原則、責任あるAI利用の基礎を身に付けた実務者を認定します。',
    examContent: 'Claudeモデルファミリーの特徴（Opus/Sonnet/Haiku）、プロンプト設計原則（Few-shot, CoT等）、コンテキストウィンドウの活用、安全性・ハルシネーション対策。',
    contentOutline: '【出題分野】1.0 Claudeモデルの特性と選定、2.0 効果的なプロンプト設計手法、3.0 コンテキストとトークン管理、4.0 AI安全性とバイアス軽減、5.0 業務プロセスのAI活用。',
  },
  'anthropic-ccar-f': {
    category: 'Architecture / Foundations',
    examDuration: '75分',
    examFormat: 'オンライン選択式・シナリオ問題（約60問）',
    cost: '150 USD（約22,500円）',
    testingOptions: 'オンライン監督付き試験',
    introduction: 'Claude APIを企業システムに統合するためのアーキテクチャ設計、検索拡張生成（RAG）、スケーラビリティ設計の基礎を認定します。',
    examContent: 'APIインテグレーションアーキテクチャ、RAGシステム設計、エンベディングとベクトル検索、コスト・レイテンシ最適化、エンタープライズセキュリティ。',
    contentOutline: '【出題分野】1.0 Claude APIアーキテクチャ設計、2.0 検索拡張生成(RAG)のパイプライン構築、3.0 ベクトルDB連携と埋め込み最適化、4.0 キャッシュ戦略とレイテンシ短縮、5.0 エンタープライズデータ保護。',
  },
  'anthropic-ccdv-f': {
    category: 'Developer / Foundations',
    examDuration: '75分',
    examFormat: 'オンライン選択式およびコードスニペット解析（約60問）',
    cost: '150 USD（約22,500円）',
    testingOptions: 'オンライン監督付き試験',
    introduction: 'Anthropic SDKを用いたアプリケーション開発、Tool Use（Function Calling）、構造化出力の実装スキルを証明します。',
    examContent: 'Anthropic Python/TypeScript SDK、Tool Useの実装、JSON構造化出力制御、ストリーミングレスポンス処理、エラーハンドリング。',
    contentOutline: '【出題分野】1.0 Anthropic SDKのセットアップと基本操作、2.0 Tool Useの実装と外部API連携、3.0 構造化データの抽出と検証、4.0 ストリーミング処理と非同期呼び出し、5.0 エラーハンドリングとリトライ設計。',
  },
  'anthropic-ccar-p': {
    category: 'Architecture / Professional',
    examDuration: '90分',
    examFormat: '高度シナリオ分析およびケーススタディ問題（約65問）',
    cost: '200 USD（約30,000円）',
    testingOptions: 'オンライン監督付き試験',
    introduction: '大規模エンタープライズにおける自律型エージェント設計、マルチエージェント協調、高度な安全性評価を統括するプロフェッショナル資格です。',
    examContent: 'マルチエージェントオーケストレーション、モデル評価（Evals）の設計、レッドチーミングと敵対的プロンプト耐性、コンプライアンス設計。',
    contentOutline: '【出題分野】1.0 自律型マルチエージェントシステムの設計、2.0 継続的モデル評価(Evals)フレームワーク構築、3.0 敵対的プロンプト攻撃耐性と防御、4.0 ガバナンス・監査ログ・プライバシー保護アーキテクチャ。',
  },

  // --- UiPath ---
  'uipath-automation-developer-associate': {
    category: 'Associate',
    examDuration: '90分',
    examFormat: '多肢選択式、60問',
    cost: '150 USD（約22,500円）',
    testingOptions: 'ピアソンVUE テストセンターまたはオンライン監督試験',
    introduction: 'UiPath Studioを用いた基本的な自動化プロセスの開発、データ操作、セレクター制御、例外処理を実務で適用できる開発者を認定します。',
    examContent: 'UiPath Studioの基礎、変数と引数、制御フロー、データ操作、セレクターの基礎とUI自動化、例外処理とデバッグ。',
    contentOutline: '【出題分野】1.0 UiPath Studioの基本操作、2.0 変数、引数、データ型、3.0 制御フローとループ構造、4.0 UI自動化とセレクター、5.0 データ操作（DataTable/Excel/文字列）、6.0 エラー処理とデバッグ。',
  },
  'uipath-automation-developer-professional': {
    category: 'Professional',
    examDuration: '120分',
    examFormat: '多肢選択式およびシナリオ問題、60問',
    cost: '200 USD（約30,000円）',
    testingOptions: 'ピアソンVUE テストセンターまたはオンライン監督試験',
    introduction: 'Robotic Enterprise (RE) Frameworkを用いた堅牢でスケーラブルな自動化ソリューションの設計・構築ができる高度開発者認定です。',
    examContent: 'REFrameworkのアーキテクチャとカスタマイズ、UiPath Orchestratorとの高度連携、高度なUI自動化、バックグラウンド処理、ドキュメント解析（Document Understanding）。',
    contentOutline: '【出題分野】1.0 Robotic Enterprise Frameworkの設計と実装、2.0 Orchestrator連携（キュー/アセット/トリガー）、3.0 高度なデータ操作とLINQ、4.0 ドキュメント理解とAI連携、5.0 セキュリティとパフォーマンス最適化。',
  },
  'uipath-agentic-associate': {
    category: 'Specialized / Associate',
    examDuration: '90分',
    examFormat: '多肢選択式、60問',
    cost: '150 USD（約22,500円）',
    testingOptions: 'ピアソンVUE テストセンターまたはオンライン監督試験',
    introduction: 'UiPath Autopilotや生成AI連携、エージェント型自動化ワークフローの基本概念と実装スキルを証明します。',
    examContent: '生成AI・LLMとUiPathの連携、Autopilot機能の活用、プロンプトとコンテキスト管理、エージェントワークフローの基礎、ガバナンス。',
    contentOutline: '【出題分野】1.0 エージェント型自動化の基礎、2.0 UiPath Autopilotの活用手法、3.0 AI Trust Layerとデータセキュリティ、4.0 プロンプト設計とコンテキスト統合、5.0 人とAIの協働(Human-in-the-Loop)。',
  },
  'uipath-agentic-professional': {
    category: 'Specialized / Professional',
    examDuration: '120分',
    examFormat: '多肢選択式およびアーキテクチャシナリオ問題、60問',
    cost: '200 USD（約30,000円）',
    testingOptions: 'ピアソンVUE テストセンターまたはオンライン監督試験',
    introduction: '自律型エージェント、マルチエージェントオーケストレーション、複雑なビジネス意思決定を含むエンタープライズ規模のエージェント自動化基盤を設計・構築できる専門家を認定します。',
    examContent: '高度なマルチエージェント協調設計、動的ツール連携・APIオーケストレーション、モデル選定と評価、セーフガードと監査ログ、スケーラブルなインフラ運用。',
    contentOutline: '【出題分野】1.0 自律型マルチエージェントアーキテクチャ、2.0 動的プランニングとツールオーケストレーション、3.0 ガバナンス・セーフガード・コンプライアンス、4.0 大規模エージェント運用の監視・監査。',
  },

  // --- サーティファイ ---
  'certify-c-3': {
    category: '検定3級',
    examDuration: '60分',
    examFormat: 'マークシート多肢選択式（筆記）',
    cost: '5,400円（税込）',
    testingOptions: '公開試験会場または団体受験',
    introduction: 'C言語の基本文法（データ型、演算子、制御文）を理解し、簡単なプログラムの読み書きができる初学者向け検定です。',
    examContent: '定数と変数、基本データ型、演算子、制御構文（if, switch, for, while）、標準入出力関数の利用。',
    contentOutline: '【出題範囲】1.0 基本文法とデータ型、2.0 演算子と演算順位、3.0 条件分岐と繰り返し構文、4.0 標準入出力（printf/scanf等）、5.0 簡単なアルゴリズムのトレース。',
  },
  'certify-c-2': {
    category: '検定2級',
    examDuration: '90分',
    examFormat: 'マークシート多肢選択式（筆記）',
    cost: '6,600円（税込）',
    testingOptions: '公開試験会場または団体受験',
    introduction: '関数、配列、ポインタ、構造体などC言語の中核機能を理解し、実用的な小規模プログラムを構築できる技術力を証明します。',
    examContent: '関数と引数・戻り値、配列と文字列操作、ポインタの基礎と応用、構造体と共用体、ファイル入出力処理、標準ライブラリ関数。',
    contentOutline: '【出題範囲】1.0 関数の定義と呼び出し、2.0 配列と文字列の操作、3.0 ポインタの仕組みとメモリアドレス操作、4.0 構造体と共用体の定義・利用、5.0 ファイルI/O処理。',
  },
  'certify-c-1': {
    category: '検定1級（最上位）',
    examDuration: '150分',
    examFormat: '実技試験（PC環境での仕様変更・プログラム作成・デバッグ）',
    cost: '8,400円（税込）',
    testingOptions: '公開試験会場または団体受験',
    introduction: '既存のプログラムに対する変更仕様に基づき、適切なコーディング・デバッグ・テストを行い完成させる実務開発能力を実証します。',
    examContent: '事前公開プログラムに対する仕様追加・変更、構造化プログラミング、アルゴリズムの実装、エラー処理、コンパイルと動作検証。',
    contentOutline: '【実技課題】1.0 仕様変更指示の正確な把握、2.0 C言語によるモジュール追加・修正コーディング、3.0 データ構造の実装とメモリ管理、4.0 コンパイル・リンク・デバッグとテスト検証。',
  },

  // --- Pythonエンジニア育成推進協会 ---
  'python-basic': {
    category: '基礎試験',
    examDuration: '60分',
    examFormat: 'CBT多肢選択式、40問',
    cost: '11,000円（税込、学割 5,500円）',
    testingOptions: 'オデッセイコミュニケーションズCBTテストセンター',
    introduction: '主教材「オライリー・ジャパン『Pythonチュートリアル』」に基づき、Pythonの文法基礎と標準ライブラリの使い方を証明する基礎資格です。',
    examContent: '気軽な入門、制御構造ツール、データ構造、モジュール、入出力、エラーと例外、クラス、標準ライブラリの紹介、仮想環境とパッケージ。',
    contentOutline: '【出題分野】1.0 Pythonの特徴、2.0 気軽な入門 (6%)、3.0 制御構造ツール (22.5%)、4.0 データ構造 (17.5%)、5.0 モジュール (5%)、6.0 出入力 (5%)、7.0 エラーと例外 (10%)、8.0 クラス (7.5%)、9.0 標準ライブラリ (10%)、10.0 仮想環境・その他。',
  },
  'python-data-analyst': {
    category: 'データ分析試験',
    examDuration: '60分',
    examFormat: 'CBT多肢選択式、40問',
    cost: '11,000円（税込、学割 5,500円）',
    testingOptions: 'オデッセイコミュニケーションズCBTテストセンター',
    introduction: '主教材「翔泳社『Pythonによるあたらしいデータ分析の教科書』」に基づき、NumPy, pandas, Matplotlib, scikit-learnを用いたデータ分析スキルを評価します。',
    examContent: 'データ分析エンジニアの役割、Pythonと環境、数学の基礎、ライブラリによる分析実践（NumPy, pandas, Matplotlib, scikit-learn）。',
    contentOutline: '【出題分野】1.0 データ分析エンジニアの役割 (5%)、2.0 Pythonと環境 (7.5%)、3.0 数学の基礎 (15%)、4.0 ライブラリによる分析実践 (72.5% [NumPy 17.5%, pandas 22.5%, Matplotlib 15%, scikit-learn 17.5%])。',
  },

  // --- PMAJ ---
  'pmaj-pmc': {
    category: 'プロジェクトマネジメント・コーディネーター (PMC)',
    examDuration: '100分',
    examFormat: 'CBT多肢選択式、100問',
    cost: '11,000円（税込）',
    testingOptions: 'CBTテストセンター（全国）',
    introduction: 'P2M（プロジェクト＆プログラムマネジメント）の標準フレームワークの基礎知識を習得し、プロジェクト推進を補佐・推進できる能力を証明します。',
    examContent: 'P2M標準体系、プロジェクトマネジメントの基礎、スコープマネジメント、タイムマネジメント、コストマネジメント、リスクマネジメント。',
    contentOutline: '【出題分野】1.0 P2Mの基本概念とプロジェクトマネジメント概要、2.0 プロジェクト構想と計画立案、3.0 スコープ・日程・資源の管理、4.0 コスト・品質・リスクの管理、5.0 コミュニケーションと進捗統合。',
  },
  'pmaj-pms': {
    category: 'プロジェクトマネジメント・スペシャリスト (PMS)',
    examDuration: 'プロジェクト試験: 90分、プログラム試験: 90分',
    examFormat: 'CBT多肢選択式',
    cost: '22,000円（税込）',
    testingOptions: 'CBTテストセンター',
    introduction: '複雑なプロジェクトにおいて、個別プロジェクトおよび複数プロジェクト（プログラム）を統括・成功に導く実務責任者としての能力を認定します。',
    examContent: 'プロジェクトマネジメント詳細手法、プログラムマネジメント概念、価値創造、アーキテクチャマネジメント、統合リスク管理。',
    contentOutline: '【出題分野】1.0 プロジェクトマネジメント詳細手法、2.0 プログラムマネジメント概念と価値創造シナリオ、3.0 アーキテクチャマネジメント、4.0 戦略的リスクマネジメントと組織統合。',
  },
  'pmaj-pmr': {
    category: 'プログラムマネジャー・レジスタード (PMR - 最高位)',
    examDuration: '書面審査＋面接審査',
    examFormat: '業務経歴審査および専門面接審査（口頭試問）',
    cost: '審査料 55,000円（税込）',
    testingOptions: 'PMAJ審査委員会による面接',
    introduction: '企業の経営戦略や社会イノベーションを実現する大規模プログラムマネジメントを統括できるトップレベルのマネジャーを認定します。',
    examContent: '経営戦略との整合性確保、大規模プログラムの構想・設計・実行統括、ステークホルダー合意形成、組織能力向上への貢献。',
    contentOutline: '【審査基準】1.0 プログラム構想力と戦略適合性、2.0 統合マネジメントと価値創出実績、3.0 不確実性への対応力とリーダーシップ、4.0 組織的マネジメント能力の開発実績。',
  },

  // --- PMI ---
  'pmi-pmp': {
    category: 'Professional',
    examDuration: '230分',
    examFormat: 'CBT多肢選択式（一部ドラッグ&ドロップ等含む）、180問（うち採点対象175問）',
    cost: 'PMI会員: 405 USD、非会員: 575 USD',
    testingOptions: 'ピアソンVUE テストセンターまたはオンライン監督試験',
    introduction: 'プロジェクトマネジメントの国際標準（PMBOKガイド）に準拠し、プロジェクトをリード・指示する実務能力を証明する世界最高峰の資格です。',
    examContent: '人 (People: 42%)、プロセス (Process: 50%)、ビジネス環境 (Business Environment: 8%)。予測的（ウォーターフォール）、アジャイル、ハイブリッド手法を網羅。',
    contentOutline: '【出題ドメイン】1.0 人 (People: 42%) - リーダーシップ、チーム支援、コンフリクト管理。2.0 プロセス (Process: 50%) - 計画立案、進捗管理、品質・スコープ・調達統制。3.0 ビジネス環境 (Business Environment: 8%) - コンプライアンス、価値実現、組織変革支援。',
  },

  // --- ISACA ---
  'isaca-cisa': {
    category: 'Professional',
    examDuration: '4時間（240分）',
    examFormat: 'CBT多肢選択式、150問',
    cost: 'ISACA会員: 575 USD、非会員: 760 USD',
    testingOptions: 'PSIテストセンターまたはオンライン遠隔監督試験',
    introduction: '情報システムの監査、統制、保証、セキュリティの専門家として、世界的に最も認知されている国際資格です。',
    examContent: '情報システムの監査プロセス、ITガバナンスとITマネジメント、情報システムの取得・開発・導入、運用とビジネスレジリエンス、情報資産の保護。',
    contentOutline: '【出題ドメイン】ドメイン1: 情報システムの監査プロセス (21%)、ドメイン2: ITガバナンスとITマネジメント (17%)、ドメイン3: 情報システムの取得、開発、導入 (12%)、ドメイン4: 情報システムの運用とビジネスレジリエンス (23%)、ドメイン5: 情報資産の保護 (27%)。',
  },

  // --- PeopleCert ---
  'peoplecert-itil-foundation': {
    category: 'Foundation',
    examDuration: '60分',
    examFormat: '多肢選択式（四肢択一）、40問',
    cost: '約55,000円〜65,000円（PeopleCertバウチャー価格）',
    testingOptions: 'PeopleCertオンライン監督試験または公認研修機関',
    introduction: 'ITサービスマネジメント（ITSM）のベストプラクティス「ITIL 4」の基礎概念、サービス価値システム（SVS）、4つの側面を理解していることを証明します。',
    examContent: 'サービスマネジメントの主要概念、ITILの7つの指導原則、サービスマネジメントの4つの側面、サービスバリューシステム（SVS）とサービスバリューチェーン（SVC）、主要なITILプラクティス。',
    contentOutline: '【出題分野】1.0 サービスマネジメントの主要概念、2.0 ITILの指導原則、3.0 サービスマネジメントの4つの側面、4.0 サービスバリューシステム(SVS)の目的と構成要素、5.0 主要プラクティス（インシデント管理、サービスデスク、変更実現、問題管理等）。',
  },

  // --- Fortinet ---
  'fortinet-fcp': {
    category: 'Professional',
    examDuration: '90分',
    examFormat: 'CBT多肢選択式（約50〜60問）',
    cost: '200〜400 USD（約30,000円〜60,000円、コア＋選択試験）',
    testingOptions: 'ピアソンVUE テストセンターまたはオンライン（OnVUE）',
    introduction: 'FortiGateを中心とするFortinetセキュリティファブリック製品の導入・構成・運用管理を担うセキュリティプロフェッショナル認定です。',
    examContent: 'ネットワークセキュリティ（FortiGate Administrator等）コア試験、およびパブリック/プライベートクラウドセキュリティ、セキュアアクセス等の選択試験。',
    contentOutline: '【出題分野】1.0 システム展開と初期設定、2.0 ファイアウォールポリシーとNAT、3.0 セキュリティファブリック統合、4.0 認証とアクセス制御、5.0 SSL/IPsec VPN、6.0 セキュリティプロファイル（アンチウイルス/IPS/Webフィルタ）、7.0 診断とトラブルシューティング。',
  },

  // --- Palo Alto Networks ---
  'palo-alto-pcnsa': {
    category: 'Professional',
    examDuration: '80〜90分',
    examFormat: 'CBT多肢選択式（約50〜75問）',
    cost: '175 USD（PCNSA）/ 220 USD（PCNSE）',
    testingOptions: 'ピアソンVUE テストセンターまたはオンライン',
    introduction: 'Palo Alto Networks 次世代ファイアウォール（NGFW）の設計・導入・構成・トラブルシューティングを行うエンジニアを認定します。',
    examContent: '次世代ファイアウォールのアーキテクチャ、App-ID/User-ID/Content-IDの構成、パノラマ（Panorama）による集中管理、セキュリティポリシー設計、脅威防御。',
    contentOutline: '【出題分野】1.0 次世代ファイアウォールの初期構成と管理、2.0 セキュリティゾーンとルーティング、3.0 App-IDとセキュリティポリシー、4.0 User-IDと認証統合、5.0 Content-ID（脅威防御とURLフィルタリング）、6.0 GlobalProtect(VPN)、7.0 高可用性(HA)と監視。',
  },

  // --- NTT-AT / WinActor ---
  'winactor-associate': {
    category: 'アソシエイト',
    examDuration: '60分',
    examFormat: 'CBT多肢選択式、50問',
    cost: '7,700円（税込）',
    testingOptions: 'CBTテストセンター（全国）',
    introduction: 'WinActorの基本的な操作方法、各種ノードの機能理解、基礎的なシナリオ作成能力を評価する検定です。',
    examContent: 'WinActorの基本概念・画面構成、基本ノード（待機、変数、条件分岐、繰り返し）、画像マッチング、エミュレーション、Excel操作ノード。',
    contentOutline: '【出題範囲】1.0 WinActorの基本概念と画面操作、2.0 変数とデータ管理、3.0 基本的な制御ノード（条件分岐・繰り返し）、4.0 GUI操作ノード（画像マッチング・エミュレーション）、5.0 ライブラリノード（Excel操作・ファイル操作）、6.0 シナリオ作成手順とデバッグ。',
  },
  'winactor-expert': {
    category: 'エキスパート',
    examDuration: '120分',
    examFormat: '実技試験（PC環境での複雑な業務自動化シナリオの作成・編集）',
    cost: '19,800円（税込）',
    testingOptions: '指定試験会場での実技試験',
    introduction: '複雑な業務要件に対応する高品質で例外処理を考慮した実用的なWinActorシナリオを短時間で構築できる高度技術者を認定します。',
    examContent: '複合的なシナリオ設計・作成、エラーハンドリング（例外処理）、正規表現やスクリプト実行、外部アプリケーション連携、シナリオの保守性・可読性の担保。',
    contentOutline: '【実技課題】1.0 仕様書に基づく複雑な自動化シナリオの設計と構築、2.0 例外処理とエラーハンドリングの実装、3.0 効率的な変数設計と保守性の高いモジュール構造、4.0 各種アプリケーション（Web/Windows/Excel等）の確実な操作制御。',
  },
};

/**
 * プロバイダー名、資格名、またはURLから詳細メタデータを解決する
 * @param {string} providerName 
 * @param {string} qualificationName 
 * @param {string} [url=''] 
 * @returns {object|null}
 */
function resolveProviderDetailsMeta(providerName = '', qualificationName = '', url = '') {
  const combined = `${providerName} ${qualificationName} ${url}`.toLowerCase();

  // LPI & LinuC & HTML5
  if (/lpic-1\b|lpic 1\b/i.test(combined)) return PROVIDER_DETAILS_META['lpic-1'];
  if (/lpic-2\b|lpic 2\b/i.test(combined)) return PROVIDER_DETAILS_META['lpic-2'];
  if (/lpic-3\b|lpic 3\b/i.test(combined)) return PROVIDER_DETAILS_META['lpic-3'];
  if (/linuc-1\b|linuc 1\b|linuc1/i.test(combined)) return PROVIDER_DETAILS_META['linuc-1'];
  if (/linuc-2\b|linuc 2\b|linuc2/i.test(combined)) return PROVIDER_DETAILS_META['linuc-2'];
  if (/linuc-3\b|linuc 3\b|linuc3/i.test(combined)) return PROVIDER_DETAILS_META['linuc-3'];
  if (/html5/i.test(combined)) return PROVIDER_DETAILS_META['html5'];

  // Oracle
  if (/java.*bronze|bronze.*se/i.test(combined)) return PROVIDER_DETAILS_META['oracle-java-bronze'];
  if (/bronze.*dba/i.test(combined)) return PROVIDER_DETAILS_META['oracle-master-bronze-dba'];
  if (/silver.*database|silver.*dba/i.test(combined)) return PROVIDER_DETAILS_META['oracle-master-silver-dba'];
  if (/java.*silver|silver.*se/i.test(combined)) return PROVIDER_DETAILS_META['oracle-java-silver'];
  if (/gold.*database|gold.*dba/i.test(combined)) return PROVIDER_DETAILS_META['oracle-master-gold-dba'];
  if (/java.*gold|gold.*se/i.test(combined)) return PROVIDER_DETAILS_META['oracle-java-gold'];
  if (/platinum/i.test(combined)) return PROVIDER_DETAILS_META['oracle-master-platinum'];

  // Broadcom / VMware
  if (/vcp/i.test(combined)) return PROVIDER_DETAILS_META['broadcom-vcp'];
  if (/vcap/i.test(combined)) return PROVIDER_DETAILS_META['broadcom-vcap'];
  if (/vcdx/i.test(combined)) return PROVIDER_DETAILS_META['broadcom-vcdx'];
  if (/vcta/i.test(combined)) return PROVIDER_DETAILS_META['broadcom-vcta'];

  // CompTIA
  if (/it fundamentals|itf\+|comptia_itf|\bf\b/i.test(combined) && /comptia/i.test(combined)) return PROVIDER_DETAILS_META['comptia-itf'];
  if (/\ba\+\b|comptia_a\b/i.test(combined)) return PROVIDER_DETAILS_META['comptia-a'];
  if (/network\+/i.test(combined)) return PROVIDER_DETAILS_META['comptia-network'];
  if (/security\+/i.test(combined)) return PROVIDER_DETAILS_META['comptia-security'];
  if (/cloud\+/i.test(combined)) return PROVIDER_DETAILS_META['comptia-cloud'];
  if (/linux\+/i.test(combined)) return PROVIDER_DETAILS_META['comptia-linux'];
  if (/server\+/i.test(combined)) return PROVIDER_DETAILS_META['comptia-server'];
  if (/casp/i.test(combined)) return PROVIDER_DETAILS_META['comptia-casp'];
  if (/pentest/i.test(combined)) return PROVIDER_DETAILS_META['comptia-pentest'];
  if (/project\+/i.test(combined)) return PROVIDER_DETAILS_META['comptia-project'];
  if (/ctt\+/i.test(combined)) return PROVIDER_DETAILS_META['comptia-ctt'];
  if (/cloud essentials/i.test(combined)) return PROVIDER_DETAILS_META['comptia-cloud-essentials'];
  if (/cysa/i.test(combined)) return PROVIDER_DETAILS_META['comptia-cysa'];
  if (/datasys/i.test(combined)) return PROVIDER_DETAILS_META['comptia-datasys'];
  if (/data\+/i.test(combined)) return PROVIDER_DETAILS_META['comptia-data'];

  // CNCF / Linux Foundation
  if (/cka/i.test(combined)) return PROVIDER_DETAILS_META['cncf-cka'];
  if (/ckad/i.test(combined)) return PROVIDER_DETAILS_META['cncf-ckad'];
  if (/cks/i.test(combined)) return PROVIDER_DETAILS_META['cncf-cks'];
  if (/kcna/i.test(combined)) return PROVIDER_DETAILS_META['cncf-kcna'];

  // Anthropic
  if (/ccao-f|associate – foundations/i.test(combined)) return PROVIDER_DETAILS_META['anthropic-ccao-f'];
  if (/ccar-f|architect – foundations/i.test(combined)) return PROVIDER_DETAILS_META['anthropic-ccar-f'];
  if (/ccdv-f|developer – foundations/i.test(combined)) return PROVIDER_DETAILS_META['anthropic-ccdv-f'];
  if (/ccar-p|architect – professional/i.test(combined)) return PROVIDER_DETAILS_META['anthropic-ccar-p'];

  // UiPath
  if (/automation developer associate/i.test(combined)) return PROVIDER_DETAILS_META['uipath-automation-developer-associate'];
  if (/automation developer professional/i.test(combined)) return PROVIDER_DETAILS_META['uipath-automation-developer-professional'];
  if (/agentic automation associate/i.test(combined)) return PROVIDER_DETAILS_META['uipath-agentic-associate'];
  if (/agentic automation professional/i.test(combined)) return PROVIDER_DETAILS_META['uipath-agentic-professional'];

  // サーティファイ
  if (/3級|３級/i.test(combined) && /c言語|certify|sikaku/i.test(combined)) return PROVIDER_DETAILS_META['certify-c-3'];
  if (/2級|２級/i.test(combined) && /c言語|certify|sikaku/i.test(combined)) return PROVIDER_DETAILS_META['certify-c-2'];
  if (/1級|１級/i.test(combined) && /c言語|certify|sikaku/i.test(combined)) return PROVIDER_DETAILS_META['certify-c-1'];

  // Pythonエンジニア育成推進協会
  if (/基礎試験/i.test(combined) && /python/i.test(combined)) return PROVIDER_DETAILS_META['python-basic'];
  if (/データ分析/i.test(combined) && /python/i.test(combined)) return PROVIDER_DETAILS_META['python-data-analyst'];

  // PMAJ
  if (/\bpmc\b/i.test(combined)) return PROVIDER_DETAILS_META['pmaj-pmc'];
  if (/\bpms\b/i.test(combined)) return PROVIDER_DETAILS_META['pmaj-pms'];
  if (/\bpmr\b/i.test(combined)) return PROVIDER_DETAILS_META['pmaj-pmr'];

  // PMI
  if (/\bpmp\b/i.test(combined)) return PROVIDER_DETAILS_META['pmi-pmp'];

  // ISACA
  if (/\bcisa\b/i.test(combined)) return PROVIDER_DETAILS_META['isaca-cisa'];

  // PeopleCert
  if (/itil/i.test(combined)) return PROVIDER_DETAILS_META['peoplecert-itil-foundation'];

  // Fortinet
  if (/fortinet|fcp/i.test(combined)) return PROVIDER_DETAILS_META['fortinet-fcp'];

  // Palo Alto
  if (/paloalto|palo alto|network security professional/i.test(combined)) return PROVIDER_DETAILS_META['palo-alto-pcnsa'];

  // WinActor
  if (/アソシエイト|associate/i.test(combined) && /winactor/i.test(combined)) return PROVIDER_DETAILS_META['winactor-associate'];
  if (/エキスパート|expert/i.test(combined) && /winactor/i.test(combined)) return PROVIDER_DETAILS_META['winactor-expert'];

  return null;
}

module.exports = {
  PROVIDER_DETAILS_META,
  resolveProviderDetailsMeta,
};

# ライフストック (Life Stock) - ウェブアプリ

「ライフストック」は、人生の出来事をスコア化し、投資のタイミングを競う推理型パーティーゲームです。

## GitHub Pages への公開方法

このプロジェクトは GitHub Actions を使用して、GitHub Pages へ自動デプロイするように設定されています。

1. **GitHub リポジトリの作成**: 新しいリポジトリを GitHub 上に作成します。
2. **コードのプッシュ**: このプロジェクトのファイルをリポジトリの `main` ブランチにプッシュします。
3. **GitHub Pages の設定**:
   - リポジトリの `Settings` > `Pages` を開きます。
   - `Build and deployment` > `Source` を **"GitHub Actions"** に変更します。
4. **公開完了**: 次回のプッシュ時に、自動的にビルドとデプロイが行われ、ウェブアプリとして公開されます。

## 開発スタック

- **Frontend**: React, Tailwind CSS (v4), Motion
- **Backend**: Supabase (Edge Functions, Auth, KV Store)
- **Deployment**: GitHub Actions + GitHub Pages

## 注意事項

- オンライン対戦機能は Supabase を使用しています。
- 静的サイトとしてホスティングされるため、ビルドされたファイル（HTML/CSS/JS）のみで動作します。

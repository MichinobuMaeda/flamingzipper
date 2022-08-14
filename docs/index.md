# Flaming Zipper

日本郵便のサイトから郵便番号データを取得してJSON形式に変換したものを提供します。

簡易版、都道府県コード、市区町村コードは当面アクセス制限なしで公開します。
ただし、アクセス数が増えてクラウドの費用がかかるようになりましたら登録したアカウントだけに提供する形に変更します。

このサービスは、現在、個人で運用しています。同様のサービスは他にもあるので、仕事で必要な場合はそれらのものを検討してください。

標準版とアカウント登録機能は開発中です。

## 簡易版

URL: https://storage.googleapis.com/flamingzipper.appspot.com/simple/[3桁].json

それぞれの郵便番号に対して1件のデータです。
入力された郵便番号に対応する住所を自動で記入する使い方を想定しています。

サンプル: <https://storage.googleapis.com/flamingzipper.appspot.com/simple/060.json>

```
{
  "0000": {
    "pref": "北海道",
    "city": "札幌市中央区",
    "addr1": "",
    "addr2": "",
    "name": ""
  },
  "0001":{
    "pref": "北海道",
    "city": "札幌市中央区",
    "addr1": "北一条西",
    "addr2": "",
    "name": ""
  },
    ... ... ...
  "8406": {
    "pref": "北海道",
    "city": "札幌市中央区",
    "addr1": "北１条西",
    "addr2": "１丁目６番地",
    "name": "北海道テレビ放送　株式会社"
  }
    ... ... ...
}
```

例えば

```
13103,"105  ","1050022","ﾄｳｷｮｳﾄ","ﾐﾅﾄｸ","ｶｲｶﾞﾝ(1､2ﾁｮｳﾒ)","東京都","港区","海岸（１、２丁目）",1,0,1,0,0,0
```

の場合、次のようなデータになります。

<https://storage.googleapis.com/flamingzipper.appspot.com/simple/105.json>

```
{
  "0022": {
    "pref": "東京都",
    "city": "港区",
    "addr1": "海岸",
    "addr2": "",
    "name":""
  }
    ... ... ...
} 
```

標準版では「海岸１丁目」と「海岸２丁目」を含むデータを提供する予定です。

## 標準版

それぞれの郵便番号に対して1件または複数件のデータです。
入力された郵便番号に対応する住所を一覧で表示し、そこから選択する使い方を想定しています。

開発中

## アカウント登録

開発中

## 都道府県コード

URL: <https://storage.googleapis.com/flamingzipper.appspot.com/jisx0401.json>

JIS X 0401 に準拠する都道府県コードです。

```
[
  {
    "code": "01",
    "name": "北海道",
    "kana": "ﾎｯｶｲﾄﾞｳ"
  },
  {
    "code": "02",
    "name": "青森県",
    "kana":"ｱｵﾓﾘｹﾝ"
  },
    ... ... ...
```

## 市区町村コード

URL: <https://storage.googleapis.com/flamingzipper.appspot.com/jisx0402.json>

JIS X 04012 に準拠する自治体コードのうち、郵便番号データに含まれるものです。

```
[
  {
    "code": "01101",
    "name": "札幌市中央区",
    "kana": "ｻｯﾎﾟﾛｼﾁｭｳｵｳｸ"
  },
  {
    "code": "01102",
    "name": "札幌市北区",
    "kana": "ｻｯﾎﾟﾛｼｷﾀｸ"
  },
    ... ... ...
```

## 開発

ソース: <https://github.com/MichinobuMaeda/flamingzipper>

要望・不具合の報告など: <https://github.com/MichinobuMaeda/flamingzipper/issues>

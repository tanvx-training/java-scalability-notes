# Thư viện bên thứ ba (vendored)

| Tệp | Nguồn | Vì sao nhúng kèm |
|---|---|---|
| `mermaid.min.js` | [mermaid](https://github.com/mermaid-js/mermaid) v11.17.1, bản UMD (`dist/mermaid.min.js`) — MIT | Để app chạy được trên server nội bộ không ra internet. Bản ESM (`mermaid.esm.min.mjs`) bị code-split thành ~1.000 tệp chunk nên không nhúng kèm được; bản UMD là một tệp tự chứa. |

Cập nhật:

```bash
npm pack mermaid@11 && tar xzf mermaid-*.tgz package/dist/mermaid.min.js \
  && mv package/dist/mermaid.min.js webapp/js/vendor/ && rm -rf package mermaid-*.tgz
```

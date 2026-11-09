# Site Shot

A AI generated tool to create beautiful screenshots of websites quickly.

Enter a website URL and see it live on a monitor, laptop, tablet and phone, each rendered at its own screen width. Then download the result as a PNG. Runs entirely in the browser, with no build step and no dependencies.

## Deploy on GitHub Pages

1. Create a new public repository and add `index.html` to the root.
2. Open **Settings → Pages**.
3. Under **Build and deployment**, choose **Deploy from a branch**, select `main` and `/ (root)`, then save.
4. After a minute the tool is live at `https://<your-username>.github.io/<repo-name>/`.

## Use

- Type a URL and click **Load website**. Scroll or click inside a device to choose what it shows.
- If a site refuses to load in a frame, upload a screenshot instead (a separate mobile screenshot is optional).
- Choose a background preset or colors and adjust opacity, or select Transparent.
- Settings and the last loaded website URL are saved in your browser. Uploaded screenshots must be selected again after reloading.
- Click **Download PNG** and choose this tab when the browser asks to share it.

## Limits

- Sites that send `X-Frame-Options` or a CSP `frame-ancestors` header cannot be shown in an iframe. This is enforced by the visited site and cannot be bypassed from a static page.
- `http://` sites are blocked from loading inside an `https://` page.
- The download uses screen capture of the current tab, so it works best in Chrome or Edge. Transparent exports combine two captures; moving content can produce artifacts.

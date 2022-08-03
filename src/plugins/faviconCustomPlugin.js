module.exports = function faviconCustomPlugin() {
    return {
        injectHtmlTags() {
            return {
                headTags: [
                    {
                        tagName: "link",
                        attributes: {
                            rel: "apple-touch-icon",
                            sizes: "180x180",
                            href: "/img/favicons/apple-touch-icon.png",
                        },
                    },
                    {
                        tagName: "link",
                        attributes: {
                            rel: "icon",
                            type: "image/png",
                            sizes: "32x32",
                            href: "/img/favicons/favicon-32x32.png",
                        },
                    },
                    {
                        tagName: "link",
                        attributes: {
                            rel: "icon",
                            type: "image/png",
                            sizes: "16x16",
                            href: "/img/favicons/favicon-16x16.png",
                        },
                    },
                    {
                        tagName: "link",
                        attributes: {
                            rel: "icon",
                            type: "image/svg+xml",
                            href: "/img/favicons/favicon.svg",
                        },
                    },
                    {
                        tagName: "link",
                        attributes: {
                            rel: "icon",
                            type: "image/png",
                            href: "/img/favicons/favicon.png",
                        },
                    },
                    {
                        tagName: "link",
                        attributes: {
                            rel: "manifest",
                            href: "/img/favicons/site.webmanifest",
                        },
                    },
                    {
                        tagName: "link",
                        attributes: {
                            rel: "mask-icon",
                            color: "#ffffff",
                            href: "/img/favicons/safari-pinned-tab.svg",
                        },
                    },
                    {
                        tagName: "meta",
                        attributes: {
                            name: "theme-color",
                            content: "#ffffff",
                        },
                    },
                    {
                        tagName: "meta",
                        attributes: {
                            name: "msapplication-config",
                            content: "/img/favicons/browserconfig.xml",
                        },
                    },
                ],
            };
        },
    };
};

import { QuartzConfig } from "./quartz/cfg"
import * as Plugin from "./quartz/plugins"

/**
 * Dev Docs Configuration
 *
 * See https://ericnguyen1206.github.io/erion-vault//configuration for more information.
 */
const config: QuartzConfig = {
  configuration: {
    pageTitle: "Dev Docs",
    pageTitleSuffix: "",
    enableSPA: true,
    enablePopovers: true,
    analytics: {
      provider: "plausible",
    },
    locale: "en-US",
    baseUrl: "quartz.ericnguyen1206.github.io/erion-vault",
    ignorePatterns: ["private", "templates", ".obsidian"],
    defaultDateType: "modified",
    theme: {
      fontOrigin: "googleFonts",
      cdnCaching: true,
      typography: {
        header: "Schibsted Grotesk",
        body: "Source Sans Pro",
        code: "IBM Plex Mono",
      },
      colors: {
        lightMode: {
          light: "#F5F6F8",
          lightgray: "#D0D4DB",
          gray: "#9BA1AC",
          darkgray: "#4B4F58",
          dark: "#1E1F25",

          secondary: "#6B3FA0",
          tertiary: "#2364AA",

          highlight: "rgba(107, 63, 160, 0.12)",
          textHighlight: "rgba(35, 100, 170, 0.42)",
        },

        darkMode: {
          light: "#0C0F14",
          lightgray: "#1A1D24",
          gray: "#AEB7C4",
          darkgray: "#D9DEE7",
          dark: "#FFFFFF",

          secondary: "#6B3FA0",
          tertiary: "#2364AA",

          highlight: "rgba(107, 63, 160, 0.14)",
          textHighlight: "rgba(35, 100, 170, 0.45)",
        },
      }

    },
  },
  plugins: {
    transformers: [
      Plugin.FrontMatter(),
      Plugin.CreatedModifiedDate({
        priority: ["frontmatter", "git", "filesystem"],
      }),
      Plugin.SyntaxHighlighting({
        theme: {
          light: "github-light",
          dark: "github-dark",
        },
        keepBackground: false,
      }),
      Plugin.ObsidianFlavoredMarkdown({ enableInHtmlEmbed: false }),
      Plugin.GitHubFlavoredMarkdown(),
      Plugin.TableOfContents(),
      Plugin.CrawlLinks({ markdownLinkResolution: "shortest" }),
      Plugin.Description(),
      Plugin.Latex({ renderEngine: "katex" }),
    ],
    filters: [Plugin.RemoveDrafts()],
    emitters: [
      Plugin.AliasRedirects(),
      Plugin.ComponentResources(),
      Plugin.ContentPage(),
      Plugin.FolderPage(),
      Plugin.TagPage(),
      Plugin.ContentIndex({
        enableSiteMap: true,
        enableRSS: true,
      }),
      Plugin.Assets(),
      Plugin.Static(),
      Plugin.Favicon(),
      Plugin.NotFoundPage(),
      // Comment out CustomOgImages to speed up build time
      Plugin.CustomOgImages(),
    ],
  },
}

export default config

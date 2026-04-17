---
# blueprint: copy this to create a new page
title: Page Title
pageId: unique-id-for-menu # optional, defaults to filename
layout: layout-default.njk # mandatory, choose from src/routes/
lang: en # optional, defaults to site config

menuMain:
  name: Menu Name # optional, defaults to title
  order: 10 # lower numbers appear first
  show: true # set to false to hide from menu

seo:
  description: Short meta description for search engines
  robots: index, follow
  canonicalSelf: https://example.com/custom-url # optional

openGraph:
  image: /assets/images/gulp-devstack-open-graph.png
  description: Social media description (falls back to seo.description)
  
twitterCards:
  use: true # set to true to enable specific twitter meta
  image: /assets/images/gulp-devstack-open-graph.png
---

# Your Page Content

Write your page content in Markdown.

## Using Components

You can use Nunjucks macros directly in this markdown file:

{% from "components/card/card.njk" import card %}

{{ card(
title = "Look, a Component!",
text = "This card was rendered inside a Markdown file."
) }}

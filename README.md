# Abdul Basit Behlim — Research Portfolio

This repository contains the source code for my personal research portfolio.

The website brings together my work in biotechnology, computational biology, CRISPR, bioinformatics, machine learning, phage biology, endolysins, and bioprocess modelling.

**Live website:** https://abdulbasitbehlim.github.io/  
**GitHub profile:** https://github.com/abdulbasitbehlim  
**ORCID:** https://orcid.org/0009-0003-5240-5413

---

## Why I made this website

I wanted one place where I could present my research interests, scientific software, projects, academic journey, and contact details in a clear way.

The site is built as a simple static website using HTML, CSS, and JavaScript. There is no complicated web framework behind it, so the project is also useful for learning how a portfolio website works from the basic files.

---

## Main files

Here is the basic structure of the website:

\`\`\`text
abdulbasitbehlim.github.io/
│
├── index.html
├── script.js
├── styles.css
├── styles/
│   ├── 01.css
│   ├── 02.css
│   ├── 03.css
│   ├── 04.css
│   ├── 05.css
│   ├── 06.css
│   └── 07.css
│
├── assets/
│   ├── favicon.svg
│   ├── helix.svg
│   ├── phage-transparent.png
│   └── protein-transparent.png
│
└── .nojekyll
\`\`\`

### What each file does

- **\`index.html\`** contains the main content of the website.
- **\`script.js\`** controls interactive features such as the theme switch, mobile menu, project filters, scrolling behaviour, motion controls, and copy-email button.
- **\`styles.css\`** loads the smaller CSS files.
- **\`styles/01.css\` to \`styles/07.css\`** divide the website styling into manageable sections.
- **\`assets/\`** stores the images and illustrations used on the website.
- **\`.nojekyll\`** tells GitHub Pages to serve the site as a normal static website.

---

## How the website works

The browser first loads \`index.html\`.

That HTML file then loads:

1. the CSS files for the visual design;
2. the JavaScript file for interactivity;
3. the images stored inside the \`assets\` folder.

The website does not need a database or backend server. GitHub Pages hosts the files directly.

---

## Features

The current website includes:

- responsive desktop and mobile layout;
- dark and light themes;
- project filtering;
- research and project sections;
- academic journey and awards;
- motion and reduced-motion support;
- mobile navigation;
- scroll progress indicator;
- ORCID, GitHub, LinkedIn, and email links;
- accessibility-focused labels and keyboard behaviour;
- SEO and structured metadata.

---

## Running the website locally

You do not need any special Python or JavaScript package.

Clone the repository:

\`\`\`bash
git clone https://github.com/abdulbasitbehlim/abdulbasitbehlim.github.io.git
cd abdulbasitbehlim.github.io
\`\`\`

Then open \`index.html\` in a browser.

For a better local-development setup, you can also use a simple local web server or the Live Server extension in Visual Studio Code.

---

## Making changes

For normal updates:

- edit **\`index.html\`** when changing text, projects, links, or sections;
- edit **\`script.js\`** when changing interactive behaviour;
- edit the appropriate file inside **\`styles/\`** when changing the appearance;
- place new images inside **\`assets/\`**.

I keep the CSS divided into multiple files so that one very large stylesheet does not become difficult to understand.

---

## Research areas shown on the site

My current portfolio includes work related to:

- CRISPR and guide-RNA design;
- computational biology and bioinformatics;
- machine learning for biological data;
- bioprocess modelling and soft sensors;
- bacteriophages and endolysins;
- structural and computational biology.

The portfolio will continue to change as my research develops.

---

## Licensing

The source code and the personal/research content do not use exactly the same license.

### Website code

The original HTML, CSS, and JavaScript written for this website are available under the **MIT License**.

See:

- [LICENSE-CODE.md](LICENSE-CODE.md)

### Portfolio content

My biography, research descriptions, project descriptions, branding, original visual material, and other non-code content are:

**Copyright © 2026 Abdul Basit Behlim — All rights reserved.**

See:

- [CONTENT-LICENSE.md](CONTENT-LICENSE.md)
- [LICENSE](LICENSE)

---

## Contact

For research discussions, collaboration, or questions about the projects shown here, the easiest way to reach me is through the contact links on the website.

**Portfolio:** https://abdulbasitbehlim.github.io/

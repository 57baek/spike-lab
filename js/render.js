async function loadJSON(path) {
    const res = await fetch(path, { cache: "no-store" });
    if (!res.ok)
        throw new Error(
            `Failed to load ${path}: ${res.status} ${res.statusText}`
        );
    return res.json();
}

function $(id) {
    return document.getElementById(id);
}

function setText(id, text) {
    const el = $(id);
    if (!el) return;
    el.textContent = text ?? "";
}

function setAttr(id, attr, value) {
    const el = $(id);
    if (!el) return;
    if (value == null || value === "") {
        el.removeAttribute(attr);
    } else {
        el.setAttribute(attr, value);
    }
}

function clearChildren(el) {
    if (!el) return;
    while (el.firstChild) el.removeChild(el.firstChild);
}

function el(tag, { className, text, attrs } = {}) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    if (attrs) {
        for (const [k, v] of Object.entries(attrs)) {
            if (v != null && v !== "") node.setAttribute(k, v);
        }
    }
    return node;
}

function renderFavicon(data) {
    const faviconPath = data.head?.favicon;
    if (!faviconPath) return;
    let link = document.getElementById("favicon");
    link.href = faviconPath;
}

function renderMeta(data) {
    // ---- Title (SEO) ----
    if (data.meta?.title) document.title = data.meta.title;
    // ---- Description (SEO) ----
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc && data.meta?.description) {
        metaDesc.setAttribute("content", data.meta.description);
    }
}

function renderHeader(data) {
    const labName = data.head?.labName ?? "";
    setText("brand-name", labName);

    //const logo = data.header?.labLogo;
    //if (logo?.src) setAttr("brand-logo", "src", logo.src);
    //setAttr("brand-logo", "alt", logo?.alt ?? `${labName} logo`);
}

function renderHero(data) {
    const hero = data.hero ?? {};
    setText("hero-tagline-1", hero.tagline1 ?? "");
    setText("hero-tagline-2", hero.tagline2 ?? "");

    if (hero.animation) {
        setAttr("hero-animation", "src", hero.animation.src);
        setAttr("hero-animation", "alt", hero.animation.alt ?? "");
    }
    if (hero.logo) {
        setAttr("hero-logo", "src", hero.logo.src);
        setAttr("hero-logo", "alt", hero.logo.alt ?? "");
    }
}

function renderAbout(data) {
    const about = data.main?.about;
    if (!about) return;
    setText("about-title", about.title ?? "About");
    setText("about-text", about.text ?? "");
}

function renderResearch(data) {
    const research = data.main?.research;
    if (!research) return;
    setText("research-title", research.title ?? "Research");

    const list = $("research-list");
    if (!list) return;
    clearChildren(list);
    for (const [index, item] of (research.items ?? []).entries()) {
        const li = el("li", { className: "research-item" });
        if (item.name)
            li.appendChild(
                el("h3", { className: "research-name", text: item.name })
            );
        if (item.image) {
            li.appendChild(
                el("img", {
                    className: "research-image",
                    attrs: {
                        src: item.image,
                        alt: item.alt ?? `Research image ${index + 1}`,
                        loading: "lazy",
                    },
                })
            );
        }
        if (item.description)
            li.appendChild(
                el("p", {
                    className: "research-description",
                    text: item.description,
                })
            );
        list.appendChild(li);
    }
}
function renderPeople(data) {
    const people = data.main?.people;
    if (!people) return;
    setText("people-title", people.title ?? "People");

    const container = $("people-list");
    if (!container) return;
    clearChildren(container);
    // Map link keys -> label + icon object
    const iconMap = [
        { key: "linkedin", label: "LinkedIn", icon: people.linkedInIcon },
        {
            key: "scholar",
            label: "Google Scholar",
            icon: people.googleScholarIcon,
        },
        { key: "github", label: "GitHub", icon: people.githubIcon },
    ];
    for (const group of people.groups ?? []) {
        // Group
        const groupWrap = el("section", { className: "people-group" });
        if (group.groupTitle) {
            groupWrap.appendChild(
                el("h3", {
                    className: "people-group-title",
                    text: group.groupTitle,
                })
            );
        }
        const ul = el("ul", { className: "people-cards" });
        for (const m of group.members ?? []) {
            const card = el("li", { className: "person-card" });
            // Name
            if (m.name) {
                card.appendChild(
                    el("h4", { className: "person-name", text: m.name })
                );
            }
            // Photo
            if (m.photo) {
                card.appendChild(
                    el("img", {
                        className: "person-photo",
                        attrs: {
                            src: m.photo,
                            alt: `${m.name ?? "Lab member"} photo`,
                            loading: "lazy",
                        },
                    })
                );
            }
            // Icons
            const links = m.links ?? null;
            if (links) {
                const icons = el("div", { className: "person-links" });
                for (const { key, label, icon } of iconMap) {
                    const url = links[key];
                    // Skip rendering this icon if the URL is empty, null, or undefined
                    if (!url || !icon?.src) continue;
                    const a = el("a", {
                        className: "person-link",
                        attrs: {
                            href: url,
                            target: "_blank",
                            rel: "noopener noreferrer",
                            "aria-label": label,
                            title: label,
                        },
                    });
                    a.appendChild(
                        el("img", {
                            className: "person-link-icon",
                            attrs: {
                                src: icon.src,
                                alt: icon.alt ?? label,
                                loading: "lazy",
                            },
                        })
                    );
                    icons.appendChild(a);
                }
                // Only add the icons block if at least one icon exists
                if (icons.childElementCount > 0) {
                    card.appendChild(icons);
                }
            }
            // Role
            if (m.role) {
                card.appendChild(
                    el("p", { className: "person-role", text: m.role })
                );
            }
            // Email
            if (m.email) {
                const emailP = el("p", { className: "person-email" });
                emailP.appendChild(
                    el("a", {
                        text: m.email,
                        attrs: { href: `mailto:${m.email}` },
                    })
                );
                card.appendChild(emailP);
            }
            // Description
            if (m.description) {
                card.appendChild(
                    el("p", {
                        className: "person-description",
                        text: m.description,
                    })
                );
            }
            ul.appendChild(card);
        }
        groupWrap.appendChild(ul);
        container.appendChild(groupWrap);
    }
}

function renderPublications(data) {
    const pubs = data.main?.publications;
    if (!pubs) return;
    setText("publications-title", pubs.title ?? "Publications");

    const container = $("publications-list");
    if (!container) return;
    clearChildren(container);
    for (const group of pubs.groups ?? []) {
        const yearWrap = el("section", { className: "pub-year" });
        if (group.year)
            yearWrap.appendChild(
                el("h3", {
                    className: "pub-year-title",
                    text: String(group.year),
                })
            );
        const ul = el("ul", { className: "pub-list" });
        for (const item of group.items ?? []) {
            const li = el("li", { className: "pub-item" });
            if (item.url) {
                // Publication has an external link → render as clickable anchor
                const a = el("a", {
                    className: "pub-link",
                    text: item.text ?? "",
                    attrs: {
                        href: item.url,
                        target: "_blank",
                        rel: "noopener noreferrer",
                    },
                });
                li.appendChild(a);
            } else {
                // Publication has no URL → render as plain text
                li.appendChild(el("span", { text: item.text ?? "" }));
            }
            ul.appendChild(li);
        }
        yearWrap.appendChild(ul);
        container.appendChild(yearWrap);
    }
}

function renderPhotos(data) {
    const photos = data.main?.photos;
    if (!photos) return;
    setText("photos-title", photos.title ?? "Photos");

    const grid = $("photos-grid");
    if (!grid) return;
    clearChildren(grid);
    for (const [index, item] of (photos.items ?? []).entries()) {
        const figure = el("figure", { className: "photo-card" });
        if (item.image) {
            figure.appendChild(
                el("img", {
                    className: "photo-image",
                    attrs: {
                        src: item.image,
                        alt: item.alt ?? `Photo ${index + 1}`,
                        loading: "lazy",
                    },
                })
            );
        }
        if (item.caption) {
            figure.appendChild(
                el("figcaption", {
                    className: "photo-caption",
                    text: item.caption,
                })
            );
        }
        grid.appendChild(figure);
    }
}

function renderContact(data) {
    const contact = data.main?.contact;
    if (!contact) return;
    setText("contact-title", contact.title ?? "Contact");

    const container = $("contact-text");
    if (!container) return;
    clearChildren(container);
    const text = contact.text ?? "";
    const email = contact.email ?? "";
    const linkText = "principal investigator";
    if (!email || !text.includes(linkText)) {
        container.textContent = text;
        return;
    }
    const [before, after] = text.split(linkText);
    container.appendChild(document.createTextNode(before));
    container.appendChild(
        el("a", {
            text: linkText,
            attrs: {
                href: `mailto:${email}`,
            },
        })
    );
    container.appendChild(document.createTextNode(after));
}

function renderFooter(data) {
    setText("year", String(new Date().getFullYear()));
    const footer = data.footer ?? {};
    setText("footer-owner", footer.owner ?? "");
    setText("footer-disclaimer", footer.disclaimer ?? "");

    const licenseEl = $("footer-license");
    if (!licenseEl) return;
    clearChildren(licenseEl);
    const text = footer.licenseText ?? "";
    const url = footer.sourceCode ?? "";
    const linkText = "Website source code";
    if (!url || !text.includes(linkText)) {
        licenseEl.textContent = text;
        return;
    }
    const [before, after] = text.split(linkText);
    licenseEl.appendChild(document.createTextNode(before));
    licenseEl.appendChild(
        el("a", {
            text: linkText,
            attrs: {
                href: url,
                target: "_blank",
                rel: "noopener noreferrer",
            },
        })
    );
    licenseEl.appendChild(document.createTextNode(after));
}

async function main() {
    try {
        const data = await loadJSON("content/content.json");
        renderFavicon(data);
        renderMeta(data);
        renderHeader(data);
        renderHero(data);
        renderAbout(data);
        renderResearch(data);
        renderPeople(data);
        renderPublications(data);
        renderPhotos(data);
        renderContact(data);
        renderFooter(data);
    } catch (err) {
        console.error(err);
        document.body.insertAdjacentHTML(
            "afterbegin",
            '<p style="padding:1rem;color:#b00020;">Content failed to load. Please refresh.</p>'
        );
    }
}

document.addEventListener("DOMContentLoaded", main);

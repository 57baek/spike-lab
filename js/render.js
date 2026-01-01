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

function renderMeta(data) {
    // <title> and <meta name="description"> are in <head>, not by id
    if (data.meta?.title) document.title = data.meta.title;

    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc && data.meta?.description) {
        metaDesc.setAttribute("content", data.meta.description);
    }
}

function renderHeader(data) {
    // brand name in header
    // You said: use hero.labName as the single source of truth
    const labName = data.hero?.labName ?? "";
    setText("brand-name", labName);

    // OPTIONAL: If you later want brand-logo to be driven by JSON,
    // add something like data.meta.brandLogo and use:
    // setAttr("brand-logo", "src", data.meta?.brandLogo);
    // setAttr("brand-logo", "alt", `${labName} logo`);
}

function renderHero(data) {
    setText("hero-lab-name", data.hero?.labName ?? "");

    // You have tagline1 + tagline2 (two lines).
    // Your HTML currently has ONE <p id="hero-tagline"></p>.
    // So we combine them with a separator. Later, CSS can make it multiline.
    const t1 = data.hero?.tagline1 ?? "";
    const t2 = data.hero?.tagline2 ?? "";
    const combined = [t1, t2].filter(Boolean).join(" - ");
    setText("hero-tagline", combined);
}

function renderAbout(data) {
    const about = data.sections?.about;
    if (!about) return;
    setText("about-title", about.title ?? "About");
    setText("about-text", about.text ?? "");
}

function renderResearch(data) {
    const research = data.sections?.research;
    if (!research) return;

    setText("research-title", research.title ?? "Research");

    const list = $("research-list");
    if (!list) return;
    clearChildren(list);

    // Your research.items are objects: {name, description, image, alt}
    for (const item of research.items ?? []) {
        const li = el("li", { className: "research-item" });

        // Title
        if (item.name)
            li.appendChild(
                el("h3", { className: "research-name", text: item.name })
            );

        // Optional image
        if (item.image) {
            li.appendChild(
                el("img", {
                    className: "research-image",
                    attrs: {
                        src: item.image,
                        alt: item.alt ?? item.name ?? "Research image",
                        loading: "lazy",
                    },
                })
            );
        }

        // Description
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
    const people = data.sections?.people;
    if (!people) return;

    setText("people-title", people.title ?? "People");

    const container = $("people-list");
    if (!container) return;
    clearChildren(container);

    for (const group of people.groups ?? []) {
        const groupWrap = el("section", { className: "people-group" });
        if (group.groupTitle)
            groupWrap.appendChild(
                el("h3", {
                    className: "people-group-title",
                    text: group.groupTitle,
                })
            );

        const ul = el("ul", { className: "people-cards" });

        for (const m of group.members ?? []) {
            const card = el("li", { className: "person-card" });

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

            // Name + inline links (as you requested: icons next to name)
            const nameRow = el("div", { className: "person-name-row" });

            const nameEl = el("h4", {
                className: "person-name",
                text: m.name ?? "",
            });
            nameRow.appendChild(nameEl);

            const links = m.links ?? null;
            if (links && (links.linkedin || links.scholar || links.github)) {
                const icons = el("div", { className: "person-links" });

                // NOTE: Put your icon PNG/SVG paths here.
                // Example: assets/icons/linkedin.png, scholar.png, github.png
                // If you haven't created them yet, keep these and add the files later.
                const iconMap = [
                    {
                        key: "linkedin",
                        label: "LinkedIn",
                        icon: "assets/icons/linkedin.png",
                    },
                    {
                        key: "scholar",
                        label: "Google Scholar",
                        icon: "assets/icons/scholar.png",
                    },
                    {
                        key: "github",
                        label: "GitHub",
                        icon: "assets/icons/github.png",
                    },
                ];

                for (const { key, label, icon } of iconMap) {
                    const url = links[key];
                    if (!url) continue;

                    const a = el("a", {
                        className: `person-link person-link-${key}`,
                        attrs: {
                            href: url,
                            target: "_blank",
                            rel: "noopener noreferrer",
                            "aria-label": `${label} profile for ${
                                m.name ?? "member"
                            }`,
                        },
                    });

                    a.appendChild(
                        el("img", {
                            className: "person-link-icon",
                            attrs: { src: icon, alt: label, loading: "lazy" },
                        })
                    );

                    icons.appendChild(a);
                }

                nameRow.appendChild(icons);
            }

            card.appendChild(nameRow);

            // Role
            if (m.role)
                card.appendChild(
                    el("p", { className: "person-role", text: m.role })
                );

            // Email (optional)
            if (m.email) {
                const emailP = el("p", { className: "person-email" });
                const emailA = el("a", {
                    text: m.email,
                    attrs: { href: `mailto:${m.email}` },
                });
                emailP.appendChild(emailA);
                card.appendChild(emailP);
            }

            // Description
            if (m.description)
                card.appendChild(
                    el("p", {
                        className: "person-description",
                        text: m.description,
                    })
                );

            ul.appendChild(card);
        }

        groupWrap.appendChild(ul);
        container.appendChild(groupWrap);
    }
}

function renderPublications(data) {
    const pubs = data.sections?.publications;
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
                li.appendChild(el("span", { text: item.text ?? "" }));
            }

            ul.appendChild(li);
        }

        yearWrap.appendChild(ul);
        container.appendChild(yearWrap);
    }
}

function renderPhotos(data) {
    const photos = data.sections?.photos;
    if (!photos) return;

    setText("photos-title", photos.title ?? "Photos");

    const grid = $("photos-grid");
    if (!grid) return;
    clearChildren(grid);

    for (const item of photos.items ?? []) {
        const figure = el("figure", { className: "photo-card" });

        if (item.src) {
            figure.appendChild(
                el("img", {
                    className: "photo-img",
                    attrs: {
                        src: item.src,
                        alt: item.alt ?? "Lab photo",
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
    const contact = data.sections?.contact;
    if (!contact) return;

    setText("contact-title", contact.title ?? "Contact");

    const lines = $("contact-lines");
    if (!lines) return;
    clearChildren(lines);

    for (const line of contact.lines ?? []) {
        lines.appendChild(el("p", { className: "contact-line", text: line }));
    }
}

function renderFooter(data) {
    // year
    setText("year", String(new Date().getFullYear()));

    // lab name - reuse hero.labName
    const labName = data.hero?.labName ?? "";
    setText("footer-lab-name", labName);

    // copyright + disclaimer from JSON
    const footer = data.sections?.footer ?? {};
    setText("footer-copyright", footer.copyright ?? "");
    setText("footer-disclaimer", footer.disclaimer ?? "");
}

async function main() {
    try {
        const data = await loadJSON("content/content.json");
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
    }
}

document.addEventListener("DOMContentLoaded", main);

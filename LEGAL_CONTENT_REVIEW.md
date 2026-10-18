# Nigerian law content review — 18 October 2026

The app is presented as **What Does Nigerian Law Say?**, a legal information assistant. The interface uses its own scales-of-justice identity. Production requests use the current site origin unless an API URL is configured.

## Changes checked against public sources

- **Personal liberty:** corrected the unconditional 24–48 hour formulation. Section 35(5) distinguishes distance to a competent court and permits a longer period considered reasonable by a court; section 35(7)(a) contains the capital-offence exception. [Government-hosted Constitution, sections 33–35](https://osgf.gov.ng/storage/app/media/pdf/Nigeria%20Constitution%201999.pdf).
- **Right to life:** the explanation now acknowledges the limited force exceptions in section 33(2), rather than implying a court sentence is the only exception.
- **Lagos advance rent:** section 4 distinguishes sitting monthly/yearly tenants and new tenants, rather than residential and commercial tenants. The explanation flags section 1 exclusions. [Lagos Ministry of Justice, Tenancy Law 2011](https://lagosstatemoj.org/wp-content/uploads/2020/12/Tenancy-Law-2011.pdf).
- **Elections:** INEC publishes an [Electoral Act 2026](https://www.inecnigeria.org/documents/Electoral-Act-2026.pdf) whose explanatory memorandum states that it repeals the 2022 Act. Existing 2022 entries are visibly marked for current-law review and their unsupported penalty/transmission claims have been removed. They must not be used as definitive current guidance. [INEC legislation and guidelines](https://www.inecnigeria.org/elections/guidelines).

## Source handling

Library cards are labelled editorial summaries and are no longer wrapped in quotation marks. Both server implementations share the legal data and answer policy. The model receives source type and review status, must identify jurisdiction and uncertainty, and must not imply that a source URL proves current amendments were checked.

This is a targeted correction of identified issues, not a completed verification of every library entry or every amendment. Other entries remain editorial research material. The app does not perform live statutory research. A Nigerian legal practitioner should review the remaining land, criminal, family, traffic and succession entries against the applicable legislation and judgments before they are relied on as authoritative material.

## Validation

Run `node --test tests/legal-content.test.js`, `npm run build`, and `npm run lint`. Automated checks establish retrieval and presentation behaviour; they do not establish the legal correctness of generated answers.

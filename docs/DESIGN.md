# EduCareer AI 360 - Design Specification (DESIGN.md)

This document serves as the primary visual source of truth and implementation reference for the EduCareer AI 360 platform. It defines the design tokens, component patterns, and visual principles required to reproduce the design system with high fidelity.

---

## 1. PRODUCT DESIGN PRINCIPLES
EduCareer AI 360 is an enterprise-grade AI career coach. The visual personality is defined by:
- **Intelligent**: Leveraging data and AI insights to provide proactive guidance.
- **Professional & Trustworthy**: Established through a deep, dark color palette and clean, high-contrast typography.
- **Data-Driven**: Heavy use of metrics, charts, and match percentages to quantify progress.
- **Premium SaaS**: Utilizing "glassmorphism" (background blurs), subtle gradients, and generous whitespace.
- **Student-Friendly but Enterprise-Ready**: Accessible and modern for students, yet rigorous enough for university administrators and corporate recruiters.

---

## 2. BRAND
- **Brand Name**: EduCareer AI 360
- **Brand Personality**: Empowering, analytical, visionary, and supportive.
- **Logo Treatment**: Wordmark-focused with a strong emphasis on "AI 360" using the primary accent color.
- **Primary Identity**: Deep indigo/blue accents against a dark slate/charcoal background.
- **AI Identity**: Represented by specific indigo/violet gradients and the "Sparkle" icon motif (`✨`).

---

## 3. COLOR SYSTEM
The palette is built on a high-contrast dark theme.

### Foundation Colors
| Token | HEX | Purpose | Usage |
| :--- | :--- | :--- | :--- |
| `background` | `#0d0e10` | Primary page background | Full-screen background |
| `surface` | `#131316` | Standard container background | Cards, modals, sections |
| `surface-muted` | `#1b1b1e` | Low-priority surface | Search bars, secondary containers |
| `border` | `#39393c` | Subtle UI separation | Card borders, dividers |
| `text-primary` | `#ffffff` | Primary readability | Headings, primary body text |
| `text-secondary` | `#9ca3af` | Supporting information | Captions, labels, secondary body |

### Functional & Semantic Colors
| Token | HEX | Purpose | Usage |
| :--- | :--- | :--- | :--- |
| `primary` | `#6366f1` | Brand identity & primary actions | Primary buttons, active icons |
| `primary-hover` | `#818cf8` | Interaction state | Button hover states |
| `ai-accent` | `#8b5cf6` | AI-generated features | Match scores, AI insights, gradients |
| `success` | `#10b981` | Positive status | "On Track", High Match, Completions |
| `warning` | `#f59e0b` | Cautionary status | Medium priority, skill gaps |
| `danger` | `#ef4444` | Critical attention | Dropped out, High Risk, Errors |
| `info` | `#3b82f6` | General awareness | Tooltips, general notifications |

---

## 4. TYPOGRAPHY
- **Primary Font Family**: `Geist` (San-serif)
- **Scale Strategy**: High contrast between display titles and functional UI labels.

| Level | Size | Weight | Line Height | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| **Display** | 36px / 2.25rem | Bold (700) | 1.2 | Hero headings, Landing pages |
| **H1** | 28px / 1.75rem | Bold (700) | 1.2 | Section titles, Dashboard titles |
| **H2** | 20px / 1.25rem | SemiBold (600) | 1.3 | Card titles, Module headings |
| **H3** | 16px / 1rem | SemiBold (600) | 1.4 | Subsection titles |
| **Body** | 14px / 0.875rem | Regular (400) | 1.5 | General content, descriptions |
| **Small** | 12px / 0.75rem | Medium (500) | 1.4 | Secondary data, metadata |
| **Label** | 12px / 0.75rem | Bold (700) | 1.2 | Buttons, Badge text (Uppercase) |

---

## 5. SPACING SYSTEM
Base-4 spacing scale.
- `xs`: 4px
- `sm`: 8px
- `md`: 16px (Standard gap)
- `lg`: 24px (Page gutter)
- `xl`: 32px (Section spacing)
- `2xl`: 48px+ (Hero margins)

---

## 6. LAYOUT SYSTEM
- **Max Content Width**: 1440px (Desktop)
- **Mobile Gutter**: 16px (Left/Right)
- **Navigation**:
    - **Desktop**: Left Sidebar (280px) + Top AppBar (64px)
    - **Mobile**: Top AppBar (56px) + Bottom Navigation Bar (72px)
- **Grid**: 12-column grid for desktop; single column stack for mobile.
- **Card Spacing**: 16px - 24px vertical margin between cards.

---

## 7. BORDER RADIUS
- **Small (4px)**: Checkboxes, small icons.
- **Medium (8px)**: Standard buttons, input fields.
- **Large (16px)**: KPI cards, feature sections, standard cards.
- **Full**: Round badges, avatar frames, pill buttons.

---

## 8. SHADOWS
Shadows are used sparingly to maintain the clean "SaaS" aesthetic.
- **Low Elevation**: `0 1px 3px rgba(0,0,0,0.5)` (Standard cards)
- **High Elevation**: `0 10px 25px rgba(0,0,0,0.8)` (Modals, dropdowns)
- **Glass Effect**: `backdrop-filter: blur(12px); border: 1px solid rgba(255,255,255,0.1);`

---

## 9. BUTTON SYSTEM
- **Primary**: Solid `#6366f1` background, white text.
- **Secondary**: Surface-muted background (`#1b1b1e`), white text, border `#39393c`.
- **Tertiary/Ghost**: No background, primary color text.
- **Destructive**: Solid `#ef4444` background.
- **Interaction**: 5% opacity overlay on hover; `scale(0.98)` on active/press.

---

## 10. FORM COMPONENTS
- **Inputs**: Background `#131316`, border `#39393c`.
- **Focus State**: Border color shifts to Primary (`#6366f1`) with 2px outer ring.
- **Error State**: Border `#ef4444` with helper text below.

---

## 11. CARDS
- **Standard Card**: `#131316` surface, 1px border `#39393c`, 16px radius.
- **AI Insight Card**: Indigo gradient border (`#6366f1` to `#8b5cf6`), subtle translucent background.
- **KPI Card**: Large numeric display, secondary label, trend indicator (+/- %).

---

## 12. NAVIGATION
- **Active State**: Primary color icon/label with subtle background highlight.
- **Inactive State**: Gray-400 (`#9ca3af`).
- **Mobile Bottom Bar**: 5 destinations, labeled with 24px icons.

---

## 13. DATA VISUALIZATION
- **Style**: Modern, thin lines, no 3D effects.
- **Line Charts**: Primary indigo line with a subtle area fill gradient below.
- **Donut Charts**: AI Match scores use thick circular progress bars with center percentages.
- **Progress Bars**: Track color `#1b1b1e`, Fill color Primary or Semantic (Success/Warning).

---

## 14. BADGES AND STATUS
- **Success**: Green pill, low-alpha green background.
- **Warning**: Amber pill, low-alpha amber background.
- **Danger**: Red pill, low-alpha red background.
- **AI Match**: Indigo pill, white text (e.g., "98% Match").

---

## 15. AI COMPONENTS
- **AI Match Score**: Represented by a circular gauge or a high-contrast percentage badge.
- **AI Insight Card**: Marked with the `✨` icon and "AI Insight" header. Uses indigo/violet text accents.
- **AI Career Coach**: Chat-style interface with distinct avatar styling for the AI entity.

---

## 16. CAREER COMPONENTS
- **Match Analysis**: "Why you're a fit" (Success/Checkmarks) vs "Potential Gap" (Warning/Exclamation).
- **Roadmap**: Vertical timeline with distinct nodes for "Completed", "Current", and "Locked" steps.

---

## 17. RESPONSIVE DESIGN
- **Mobile (360px - 430px)**: Bottom navigation, single-column cards, full-width buttons.
- **Desktop (1440px)**: Sidebar navigation, multi-column dashboard, fixed sidebar width.

---

## 18. IMPLEMENTATION GUIDANCE
- **Consistency**: Always use the defined HEX values and spacing tokens.
- **Component Reuse**: Do not re-code the TopAppBar or BottomNavBar; use the shared components provided in the project metadata.
- **AI Distinction**: Ensure all AI-generated suggestions are visually distinct from static academic data through the use of the AI-accent color and iconography.

---

## 19. SOURCE OF TRUTH
The current EduCareer AI 360 Stitch design as seen on the canvas is the visual source of truth. This DESIGN.md is the implementation reference. Technical architecture must be handled independently.
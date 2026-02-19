"use client";

/**
 * @xhiti/auto-skeleton
 *
 * A runtime React component that transforms your actual UI into pixel-perfect,
 * responsive skeleton loaders automatically using the "Ghost Rendering" approach.
 *
 * No more duplicate JSX for loading states!
 *
 * @packageDocumentation
 */

import React, {
    Children,
    isValidElement,
    cloneElement,
    useMemo,
    createContext,
    useContext,
    type ReactNode,
    type ReactElement,
    type HTMLAttributes,
    type CSSProperties,
} from "react";

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

/**
 * Props for the AutoSkeleton component
 */
export interface AutoSkeletonProps {
    /** Whether to show the skeleton state or the actual content */
    isLoading: boolean;
    /** The children to render (will be transformed into skeleton when loading) */
    children: ReactNode;
    /** Optional className to apply to the skeleton wrapper */
    className?: string;
    /** Custom animation duration (CSS time value). Default: "1.5s" */
    animationDuration?: string;
    /** Enable/disable animations. Default: true */
    animate?: boolean;
    /**
     * Animation variant to use.
     * - "pulse": standard opacity pulse (default)
     * - "shimmer": horizontal shine sweep
     * - "wave": subtle wave animation
     * - "none": no animation, just static skeleton
     */
    animationVariant?: "pulse" | "shimmer" | "wave" | "none";
    /** Custom skeleton background class. Default: "bg-muted" for shadcn compatibility */
    skeletonBgClass?: string;
    /** Custom text masking classes */
    textMaskClass?: string;
    /** Custom image placeholder classes */
    imageMaskClass?: string;
    /** Custom button overlay classes */
    buttonMaskClass?: string;
    /** Custom icon mask classes */
    iconMaskClass?: string;
    /** Custom input/form field mask classes */
    inputMaskClass?: string;
    /** Custom badge/chip mask classes */
    badgeMaskClass?: string;
    /** Custom avatar mask classes */
    avatarMaskClass?: string;
    /**
     * Border radius to apply to skeleton shapes.
     * - "sm": 2px
     * - "md": 4px (default)
     * - "lg": 8px
     * - "full": 9999px
     * - "none": 0
     */
    borderRadius?: "sm" | "md" | "lg" | "full" | "none";
    /** Custom CSS style to apply to the skeleton wrapper */
    style?: CSSProperties;
    /** Whether to include the wrapper div (affects layout). Default: false */
    forceWrapper?: boolean;
    /** Children to always render even during loading (e.g., a progress bar) */
    persistentChildren?: ReactNode;
}

/**
 * Internal context for tracking skeleton configuration across the tree
 */
interface SkeletonConfig {
    isLoading: boolean;
    skeletonBgClass: string;
    textMaskClass: string;
    imageMaskClass: string;
    buttonMaskClass: string;
    iconMaskClass: string;
    inputMaskClass: string;
    badgeMaskClass: string;
    avatarMaskClass: string;
    animate: boolean;
    animationDuration: string;
    animationVariant: "pulse" | "shimmer" | "wave" | "none";
    borderRadius: string;
}

// ============================================================================
// REACT CONTEXT
// ============================================================================

/**
 * Context allows nested AutoSkeleton components to inherit configuration.
 * Useful when you have nested loading states.
 */
const SkeletonContext = createContext<SkeletonConfig | null>(null);

/**
 * Hook to access skeleton context from within the tree.
 * Returns null when not inside an AutoSkeleton.
 */
export function useSkeletonContext(): SkeletonConfig | null {
    return useContext(SkeletonContext);
}

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Transparent 1x1 pixel GIF data URI.
 * Used to replace actual images while maintaining their dimensions.
 */
const TRANSPARENT_PIXEL =
    "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";

/**
 * Default skeleton classes optimized for shadcn/ui and Tailwind CSS.
 * These use standard Tailwind utilities + shadcn CSS variables for
 * automatic Dark/Light mode support.
 */
const DEFAULT_CLASSES = {
    skeletonBg: "bg-muted",
    textMask: "text-transparent bg-muted select-none",
    imageMask: "bg-muted",
    buttonMask: "relative overflow-hidden",
    iconMask: "text-transparent bg-muted/50",
    inputMask: "bg-muted border-muted",
    badgeMask: "bg-muted text-transparent",
    avatarMask: "bg-muted",
} as const;

/**
 * Border radius presets
 */
const BORDER_RADIUS_MAP: Record<string, string> = {
    none: "rounded-none",
    sm: "rounded-sm",
    md: "rounded",
    lg: "rounded-lg",
    full: "rounded-full",
};

/**
 * HTML table structural elements — must preserve DOM order
 */
const TABLE_STRUCTURAL_ELEMENTS = new Set([
    "table",
    "thead",
    "tbody",
    "tfoot",
    "tr",
    "colgroup",
    "col",
    "caption",
]);

/**
 * Elements that typically contain inline/text content
 */
const TEXT_CONTAINER_ELEMENTS = new Set([
    "p",
    "span",
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    "label",
    "a",
    "li",
    "dt",
    "dd",
    "em",
    "strong",
    "b",
    "i",
    "u",
    "small",
    "mark",
    "del",
    "ins",
    "sub",
    "sup",
    "abbr",
    "cite",
    "q",
    "time",
    "figcaption",
    "blockquote",
    "code",
    "pre",
    "kbd",
    "samp",
    "var",
]);

/**
 * Form elements that need special skeleton treatment
 */
const FORM_ELEMENTS = new Set([
    "input",
    "textarea",
    "select",
    "progress",
    "meter",
]);

/**
 * Icon-related keywords in className or displayName
 */
const ICON_KEYWORDS = ["lucide", "icon", "heroicon", "radix-icon", "phosphor", "tabler-icon"];

/**
 * Avatar-related keywords
 */
const AVATAR_KEYWORDS = ["avatar", "profile-image", "user-image"];

/**
 * Badge-related keywords
 */
const BADGE_KEYWORDS = ["badge", "chip", "tag", "pill"];

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Safely merges CSS class names, filtering out falsy values.
 */
function cx(...classes: (string | undefined | null | false)[]): string {
    return classes.filter(Boolean).join(" ");
}

/**
 * Gets the animation class based on the variant.
 */
function getAnimationClass(config: SkeletonConfig): string {
    if (!config.animate || config.animationVariant === "none") return "";

    switch (config.animationVariant) {
        case "shimmer":
            return "skeleton-shimmer";
        case "wave":
            return "skeleton-wave";
        case "pulse":
        default:
            return "animate-pulse";
    }
}

/**
 * Gets the animation style object for custom duration.
 */
function getAnimationStyle(config: SkeletonConfig): CSSProperties | undefined {
    if (!config.animate || config.animationVariant === "none") return undefined;
    return { animationDuration: config.animationDuration };
}

/**
 * Get the display name of a React element's type.
 */
function getDisplayName(element: ReactElement): string {
    const type = element.type;
    if (typeof type === "string") return type;
    return (type as React.ComponentType)?.displayName
        || (type as { name?: string })?.name
        || "";
}

/**
 * Get className from element props safely.
 */
function getClassName(element: ReactElement): string {
    return ((element.props as HTMLAttributes<HTMLElement>)?.className as string) || "";
}

// ============================================================================
// ELEMENT DETECTION FUNCTIONS
// ============================================================================

/**
 * Checks if an element has the `data-skeleton-ignore` attribute.
 * Ignored elements are NOT styled but their children ARE still recursed into.
 */
function shouldIgnoreElement(element: ReactElement): boolean {
    const props = element.props as Record<string, unknown>;
    return props["data-skeleton-ignore"] === "true" || props["data-skeleton-ignore"] === true;
}

/**
 * Checks if an element has the `data-skeleton-hide` attribute.
 * Hidden elements are completely removed from the skeleton output.
 */
function shouldHideElement(element: ReactElement): boolean {
    const props = element.props as Record<string, unknown>;
    return props["data-skeleton-hide"] === "true" || props["data-skeleton-hide"] === true;
}

/**
 * Checks if an element has a `data-skeleton-class` attribute.
 * If present, this class replaces the default skeleton styling.
 */
function getCustomSkeletonClass(element: ReactElement): string | undefined {
    const props = element.props as Record<string, unknown>;
    return typeof props["data-skeleton-class"] === "string"
        ? props["data-skeleton-class"] as string
        : undefined;
}

/**
 * Detects if an element is likely an icon component.
 * Works with lucide-react, heroicons, Radix Icons, Phosphor, and custom SVG icons.
 */
function isIconElement(element: ReactElement): boolean {
    // Check if it's a native SVG element
    if (element.type === "svg") return true;

    const displayName = getDisplayName(element).toLowerCase();
    const className = getClassName(element).toLowerCase();

    // Check displayName and className for icon-related keywords
    if (ICON_KEYWORDS.some((kw) => displayName.includes(kw) || className.includes(kw))) {
        return true;
    }

    // Common icon naming patterns
    if (displayName.endsWith("icon") || displayName.startsWith("icon")) return true;

    // Lucide-react specific: components named like "ChevronDown", "ArrowLeft" with small sizes
    if (
        className.includes("lucide") ||
        (className.includes("w-") && className.includes("h-") &&
            !className.includes("w-full") && !className.includes("h-full"))
    ) {
        // Small fixed-size element — check if it has icon-like dimensions
        const sizePattern = /(?:w-[3-6]|h-[3-6]|size-[3-6])/;
        if (sizePattern.test(className) && !className.includes("text-")) {
            // Additional check: if it also has rounded-full, likely an icon
            if (className.includes("rounded")) return true;
        }
    }

    return false;
}

/**
 * Detects if an element is an image element (native `<img>` or Next.js `Image`).
 */
function isImageElement(element: ReactElement): boolean {
    if (element.type === "img") return true;

    const displayName = getDisplayName(element);
    return displayName === "Image" || displayName === "NextImage";
}

/**
 * Detects if an element is a video element.
 */
function isVideoElement(element: ReactElement): boolean {
    if (element.type === "video" || element.type === "iframe") return true;
    const displayName = getDisplayName(element);
    return displayName === "Video" || displayName === "ReactPlayer";
}

/**
 * Detects if an element is a button or button-like component.
 */
function isButtonElement(element: ReactElement): boolean {
    if (element.type === "button") return true;

    const props = element.props as HTMLAttributes<HTMLElement>;
    if (props.role === "button") return true;

    const displayName = getDisplayName(element).toLowerCase();
    return displayName.includes("button");
}

/**
 * Detects if an element is an avatar component.
 */
function isAvatarElement(element: ReactElement): boolean {
    const displayName = getDisplayName(element).toLowerCase();
    const className = getClassName(element).toLowerCase();
    return AVATAR_KEYWORDS.some((kw) => displayName.includes(kw) || className.includes(kw));
}

/**
 * Detects if an element is a badge/chip/tag component.
 */
function isBadgeElement(element: ReactElement): boolean {
    const displayName = getDisplayName(element).toLowerCase();
    const className = getClassName(element).toLowerCase();
    return BADGE_KEYWORDS.some((kw) => displayName.includes(kw) || className.includes(kw));
}

/**
 * Checks if an element is a form field.
 */
function isFormElement(element: ReactElement): boolean {
    if (typeof element.type === "string" && FORM_ELEMENTS.has(element.type)) return true;
    const displayName = getDisplayName(element).toLowerCase();
    return displayName.includes("input") || displayName.includes("textarea") || displayName.includes("select");
}

/**
 * Checks if an element is a table cell (`<td>` or `<th>`).
 */
function isTableCell(element: ReactElement): boolean {
    return element.type === "td" || element.type === "th";
}

/**
 * Checks if an element is a table structural element.
 */
function isTableStructural(element: ReactElement): boolean {
    return typeof element.type === "string" && TABLE_STRUCTURAL_ELEMENTS.has(element.type);
}

/**
 * Checks if an element is a link/anchor.
 */
function isLinkElement(element: ReactElement): boolean {
    if (element.type === "a") return true;
    const displayName = getDisplayName(element);
    return displayName === "Link" || displayName === "NextLink";
}

/**
 * Checks if an element is a separator/divider.
 */
function isSeparatorElement(element: ReactElement): boolean {
    if (element.type === "hr") return true;
    const displayName = getDisplayName(element).toLowerCase();
    return displayName.includes("separator") || displayName.includes("divider");
}

/**
 * Checks if the element is a React Fragment.
 */
function isFragment(element: ReactElement): boolean {
    return element.type === React.Fragment;
}

// ============================================================================
// CORE TRANSFORMATION FUNCTIONS
// ============================================================================

/**
 * Transforms a text string into a skeleton span.
 *
 * This is the key to "pixel-perfect" skeletons — the text still takes up
 * the exact same physical space in the DOM (same font, same line breaks),
 * but it's invisible with a pulsing muted background.
 */
function transformTextNode(text: string, config: SkeletonConfig, key?: string | number): ReactNode {
    // Preserve whitespace-only nodes for layout spacing
    if (!text.trim()) return text;

    return (
        <span
            key={key}
            className={cx(
                config.textMaskClass,
                getAnimationClass(config),
                config.borderRadius
            )}
            style={getAnimationStyle(config)}
            aria-hidden="true"
            data-skeleton-type="text"
        >
            {text}
        </span>
    );
}

/**
 * Transforms an image element into a skeleton placeholder.
 * Maintains original dimensions while hiding the actual image.
 */
function transformImageElement(element: ReactElement, config: SkeletonConfig): ReactElement {
    const props = element.props as Record<string, unknown>;
    const originalClassName = (props.className as string) || "";

    return cloneElement(element, {
        src: TRANSPARENT_PIXEL,
        srcSet: undefined,
        loading: undefined, // Remove lazy loading for skeleton
        className: cx(
            originalClassName,
            config.imageMaskClass,
            getAnimationClass(config),
            config.borderRadius
        ),
        style: {
            ...((props.style as CSSProperties) || {}),
            ...getAnimationStyle(config),
            objectFit: "cover",
        },
        alt: "",
        "aria-hidden": true,
        "data-skeleton-type": "image",
    });
}

/**
 * Transforms a video/iframe element into a skeleton placeholder.
 */
function transformVideoElement(element: ReactElement, config: SkeletonConfig): ReactElement {
    const props = element.props as Record<string, unknown>;
    const originalClassName = (props.className as string) || "";

    // Replace with a div that maintains dimensions
    return cloneElement(element, {
        src: undefined,
        className: cx(
            originalClassName,
            config.imageMaskClass,
            getAnimationClass(config),
            config.borderRadius
        ),
        style: {
            ...((props.style as CSSProperties) || {}),
            ...getAnimationStyle(config),
        },
        "aria-hidden": true,
        "data-skeleton-type": "video",
    });
}

/**
 * Transforms an icon element into a skeleton placeholder.
 * Icons get a muted circular/square treatment.
 */
function transformIconElement(element: ReactElement, config: SkeletonConfig): ReactElement {
    const props = element.props as HTMLAttributes<HTMLElement>;
    const originalClassName = props.className || "";

    return cloneElement(element, {
        className: cx(
            originalClassName,
            config.iconMaskClass,
            getAnimationClass(config),
            "rounded-sm"
        ),
        style: {
            ...(props.style || {}),
            ...getAnimationStyle(config),
        },
        "aria-hidden": true,
        "data-skeleton-type": "icon",
    } as HTMLAttributes<HTMLElement>);
}

/**
 * Transforms a button element with an overlay skeleton effect.
 * The button structure is preserved but covered with a pulsing overlay.
 */
function transformButtonElement(element: ReactElement, config: SkeletonConfig): ReactElement {
    const props = element.props as HTMLAttributes<HTMLElement>;
    const originalClassName = props.className || "";

    // Recursively transform button children (text, icons inside)
    const children = props.children;
    const transformedChildren = children !== undefined && children !== null
        ? transformChildren(children, config)
        : children;

    return cloneElement(element, {
        className: cx(
            originalClassName,
            config.buttonMaskClass,
            getAnimationClass(config)
        ),
        style: {
            ...(props.style || {}),
            ...getAnimationStyle(config),
        },
        disabled: true,
        "aria-hidden": true,
        tabIndex: -1,
        children: transformedChildren,
        "data-skeleton-type": "button",
    } as HTMLAttributes<HTMLElement>);
}

/**
 * Transforms an avatar component.
 */
function transformAvatarElement(element: ReactElement, config: SkeletonConfig): ReactElement {
    const props = element.props as HTMLAttributes<HTMLElement>;
    const originalClassName = props.className || "";

    return cloneElement(element, {
        className: cx(
            originalClassName,
            config.avatarMaskClass,
            getAnimationClass(config),
            "rounded-full"
        ),
        style: {
            ...(props.style || {}),
            ...getAnimationStyle(config),
        },
        "aria-hidden": true,
        children: null, // Remove avatar content
        "data-skeleton-type": "avatar",
    } as HTMLAttributes<HTMLElement>);
}

/**
 * Transforms a badge/chip element.
 */
function transformBadgeElement(element: ReactElement, config: SkeletonConfig): ReactElement {
    const props = element.props as HTMLAttributes<HTMLElement>;
    const originalClassName = props.className || "";
    const children = props.children;

    return cloneElement(element, {
        className: cx(
            originalClassName,
            config.badgeMaskClass,
            getAnimationClass(config)
        ),
        style: {
            ...(props.style || {}),
            ...getAnimationStyle(config),
        },
        "aria-hidden": true,
        children: children !== undefined && children !== null
            ? transformChildren(children, config)
            : children,
        "data-skeleton-type": "badge",
    } as HTMLAttributes<HTMLElement>);
}

/**
 * Transforms a form input/select/textarea into a skeleton placeholder.
 * Disables the element and applies muted background.
 */
function transformFormElement(element: ReactElement, config: SkeletonConfig): ReactElement {
    const props = element.props as Record<string, unknown>;
    const originalClassName = (props.className as string) || "";

    return cloneElement(element, {
        disabled: true,
        readOnly: true,
        value: "",
        placeholder: "",
        className: cx(
            originalClassName,
            config.inputMaskClass,
            getAnimationClass(config),
            config.borderRadius
        ),
        style: {
            ...((props.style as CSSProperties) || {}),
            ...getAnimationStyle(config),
            color: "transparent",
        },
        "aria-hidden": true,
        tabIndex: -1,
        "data-skeleton-type": "input",
    });
}

/**
 * Transforms a separator/divider — keeps it but applies muted styling.
 */
function transformSeparatorElement(element: ReactElement, config: SkeletonConfig): ReactElement {
    const props = element.props as HTMLAttributes<HTMLElement>;
    const originalClassName = props.className || "";

    return cloneElement(element, {
        className: cx(originalClassName, config.skeletonBgClass),
        "aria-hidden": true,
        "data-skeleton-type": "separator",
    } as HTMLAttributes<HTMLElement>);
}

/**
 * Transforms a link — disables navigation and recursively processes children.
 */
function transformLinkElement(element: ReactElement, config: SkeletonConfig): ReactElement {
    const props = element.props as HTMLAttributes<HTMLElement>;
    const children = props.children;
    const transformedChildren = children !== undefined && children !== null
        ? transformChildren(children, config)
        : children;

    return cloneElement(element, {
        onClick: (e: React.MouseEvent) => e.preventDefault(),
        tabIndex: -1,
        "aria-hidden": true,
        style: {
            ...(props.style || {}),
            pointerEvents: "none" as const,
            cursor: "default",
        },
        children: transformedChildren,
        "data-skeleton-type": "link",
    } as HTMLAttributes<HTMLElement>);
}

/**
 * Transforms a table cell (`<td>` or `<th>`) with skeleton content.
 * Special handling to maintain strict table DOM structure.
 */
function transformTableCell(element: ReactElement, config: SkeletonConfig): ReactElement {
    const props = element.props as HTMLAttributes<HTMLElement>;
    const originalClassName = props.className || "";
    const children = props.children;

    let transformedChildren: ReactNode;

    if (typeof children === "string") {
        // Direct text content — wrap it in a skeleton span
        transformedChildren = transformTextNode(children, config);
    } else if (typeof children === "number") {
        transformedChildren = transformTextNode(String(children), config);
    } else if (children !== undefined && children !== null) {
        // Has nested elements — recurse
        transformedChildren = transformChildren(children, config);
    } else {
        // Empty cell — add a non-breaking space as placeholder
        transformedChildren = (
            <span
                className={cx(config.textMaskClass, getAnimationClass(config))}
                style={getAnimationStyle(config)}
            >
                &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
            </span>
        );
    }

    return cloneElement(element, {
        className: cx(originalClassName),
        children: transformedChildren,
    } as HTMLAttributes<HTMLElement>);
}

/**
 * Generic element transformation — recursively processes children
 * while preserving the element's own structure.
 */
function transformGenericElement(
    element: ReactElement,
    config: SkeletonConfig,
    extraClasses?: string
): ReactElement {
    const props = element.props as HTMLAttributes<HTMLElement>;
    const children = props.children;

    // Self-closing / leaf elements without children
    if (children === undefined || children === null) {
        if (extraClasses) {
            return cloneElement(element, {
                className: cx(props.className, extraClasses),
            } as HTMLAttributes<HTMLElement>);
        }
        return element;
    }

    // Recursively transform children
    const transformedChildren = transformChildren(children, config);

    if (extraClasses) {
        return cloneElement(element, {
            className: cx(props.className, extraClasses),
            children: transformedChildren,
        } as HTMLAttributes<HTMLElement>);
    }

    return cloneElement(element, {
        children: transformedChildren,
    } as HTMLAttributes<HTMLElement>);
}

/**
 * Main recursive transformation function.
 *
 * This is the heart of "Ghost Rendering" — it walks the entire React element
 * tree using React.Children.map and applies specific transformations based
 * on element type:
 *
 *  1. Text nodes → wrapped in invisible spans with muted bg
 *  2. Images → src replaced with transparent pixel
 *  3. Icons → muted color treatment
 *  4. Buttons → disabled with overlay
 *  5. Avatars → circular muted placeholder
 *  6. Badges → muted with transparent text
 *  7. Form inputs → disabled with muted bg
 *  8. Table cells → text content masked
 *  9. Links → navigation disabled
 * 10. Separators → muted styling
 * 11. Everything else → children recursed
 */
function transformChildren(children: ReactNode, config: SkeletonConfig): ReactNode {
    // Handle null/undefined/boolean
    if (children === null || children === undefined || typeof children === "boolean") {
        return children;
    }

    // Handle text nodes (strings and numbers)
    if (typeof children === "string") {
        return transformTextNode(children, config);
    }
    if (typeof children === "number") {
        return transformTextNode(String(children), config);
    }

    // Handle arrays and single elements via React.Children.map
    return Children.map(children, (child, index) => {
        // Non-element children (strings, numbers from within arrays)
        if (!isValidElement(child)) {
            if (typeof child === "string" || typeof child === "number") {
                return transformTextNode(String(child), config, index);
            }
            return child;
        }

        // ── data-skeleton-hide: completely remove from output ──
        if (shouldHideElement(child)) {
            return null;
        }

        // ── data-skeleton-class: use custom classes instead ──
        const customClass = getCustomSkeletonClass(child);
        if (customClass) {
            const props = child.props as HTMLAttributes<HTMLElement>;
            return cloneElement(child, {
                className: cx(props.className, customClass),
                "aria-hidden": true,
            } as HTMLAttributes<HTMLElement>);
        }

        // ── data-skeleton-ignore: don't style THIS element, but still recurse ──
        if (shouldIgnoreElement(child)) {
            return transformGenericElement(child, config);
        }

        // ── React Fragments: transparently recurse ──
        if (isFragment(child)) {
            const props = child.props as { children?: ReactNode };
            return <React.Fragment key={child.key}>{transformChildren(props.children, config)}</React.Fragment>;
        }

        // ── Determine element type and apply transformation ──
        // Order matters: more specific checks come first!

        // 1. Images (native <img> and Next.js Image)
        if (isImageElement(child)) {
            return transformImageElement(child, config);
        }

        // 2. Video/iframe elements
        if (isVideoElement(child)) {
            return transformVideoElement(child, config);
        }

        // 3. Avatar components
        if (isAvatarElement(child)) {
            return transformAvatarElement(child, config);
        }

        // 4. Icon elements (SVG, lucide-react, heroicons, etc.)
        if (isIconElement(child)) {
            return transformIconElement(child, config);
        }

        // 5. Badge/chip/tag elements
        if (isBadgeElement(child)) {
            return transformBadgeElement(child, config);
        }

        // 6. Button elements
        if (isButtonElement(child)) {
            return transformButtonElement(child, config);
        }

        // 7. Form elements (input, textarea, select)
        if (isFormElement(child)) {
            return transformFormElement(child, config);
        }

        // 8. Link/anchor elements — disable navigation
        if (isLinkElement(child)) {
            return transformLinkElement(child, config);
        }

        // 9. Separator/divider elements
        if (isSeparatorElement(child)) {
            return transformSeparatorElement(child, config);
        }

        // 10. Table cells (must come before table structural)
        if (isTableCell(child)) {
            return transformTableCell(child, config);
        }

        // 11. Table structural elements — preserve DOM, just recurse
        if (isTableStructural(child)) {
            return transformGenericElement(child, config);
        }

        // 12. Text container elements — recurse into children
        if (typeof child.type === "string" && TEXT_CONTAINER_ELEMENTS.has(child.type)) {
            return transformGenericElement(child, config);
        }

        // 13. Everything else (divs, custom components, etc.) — recurse
        return transformGenericElement(child, config);
    });
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

/**
 * AutoSkeleton — A runtime skeleton loader component.
 *
 * Wraps your actual UI and transforms it into a pixel-perfect, responsive
 * skeleton loader when `isLoading` is true. Uses "Ghost Rendering" to
 * preserve exact dimensions, preventing layout shifts.
 *
 * @example
 * ```tsx
 * <AutoSkeleton isLoading={isLoading}>
 *   <Card>
 *     <CardTitle>{data.title}</CardTitle>
 *     <CardDescription>{data.description}</CardDescription>
 *   </Card>
 * </AutoSkeleton>
 * ```
 *
 * @example With options
 * ```tsx
 * <AutoSkeleton
 *   isLoading={isLoading}
 *   animationVariant="shimmer"
 *   animationDuration="2s"
 *   borderRadius="lg"
 * >
 *   <MyComponent />
 * </AutoSkeleton>
 * ```
 */
export function AutoSkeleton({
    isLoading,
    children,
    className,
    style,
    animationDuration = "1.5s",
    animate = true,
    animationVariant = "pulse",
    skeletonBgClass = DEFAULT_CLASSES.skeletonBg,
    textMaskClass = DEFAULT_CLASSES.textMask,
    imageMaskClass = DEFAULT_CLASSES.imageMask,
    buttonMaskClass = DEFAULT_CLASSES.buttonMask,
    iconMaskClass = DEFAULT_CLASSES.iconMask,
    inputMaskClass = DEFAULT_CLASSES.inputMask,
    badgeMaskClass = DEFAULT_CLASSES.badgeMask,
    avatarMaskClass = DEFAULT_CLASSES.avatarMask,
    borderRadius = "md",
    forceWrapper = false,
    persistentChildren,
}: AutoSkeletonProps): ReactNode {
    // Build the skeleton configuration object, memoized for performance
    const config = useMemo<SkeletonConfig>(
        () => ({
            isLoading,
            skeletonBgClass,
            textMaskClass,
            imageMaskClass,
            buttonMaskClass,
            iconMaskClass,
            inputMaskClass,
            badgeMaskClass,
            avatarMaskClass,
            animate,
            animationDuration,
            animationVariant,
            borderRadius: BORDER_RADIUS_MAP[borderRadius] || BORDER_RADIUS_MAP.md,
        }),
        [
            isLoading, skeletonBgClass, textMaskClass, imageMaskClass,
            buttonMaskClass, iconMaskClass, inputMaskClass, badgeMaskClass,
            avatarMaskClass, animate, animationDuration, animationVariant,
            borderRadius,
        ]
    );

    // ── Not loading: return children as-is (zero overhead) ──
    if (!isLoading) {
        if (forceWrapper || className || style) {
            return (
                <div className={className} style={style}>
                    {children}
                    {persistentChildren}
                </div>
            );
        }
        return (
            <>
                {children}
                {persistentChildren}
            </>
        );
    }

    // ── Loading: transform children into skeleton state ──
    const skeletonChildren = transformChildren(children, config);

    const wrapperContent = (
        <>
            {skeletonChildren}
            {persistentChildren}
        </>
    );

    // Wrap with context, accessibility attributes, and pointer-events disabled
    const skeleton = (
        <SkeletonContext.Provider value={config}>
            <div
                className={cx("auto-skeleton-wrapper", className)}
                style={{
                    pointerEvents: "none",
                    userSelect: "none",
                    ...style,
                }}
                role="status"
                aria-busy="true"
                aria-label="Loading content"
                data-skeleton-active="true"
            >
                {wrapperContent}
                {/* Screen reader announcement */}
                <span className="sr-only" style={{
                    position: "absolute",
                    width: "1px",
                    height: "1px",
                    padding: 0,
                    margin: "-1px",
                    overflow: "hidden",
                    clip: "rect(0, 0, 0, 0)",
                    whiteSpace: "nowrap",
                    borderWidth: 0,
                }}>
                    Loading...
                </span>
            </div>
        </SkeletonContext.Provider>
    );

    return skeleton;
}

// ============================================================================
// HOOKS
// ============================================================================

/**
 * useAutoSkeleton — A convenience hook for managing loading state.
 *
 * Provides `isLoading`, `setIsLoading`, and a `withLoading` helper
 * that wraps any Promise to automatically toggle the loading state.
 *
 * @param initialState - Whether to start in loading state (default: true)
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { isLoading, withLoading } = useAutoSkeleton();
 *
 *   useEffect(() => {
 *     withLoading(fetchData());
 *   }, []);
 *
 *   return (
 *     <AutoSkeleton isLoading={isLoading}>
 *       <Content />
 *     </AutoSkeleton>
 *   );
 * }
 * ```
 */
export function useAutoSkeleton(initialState = true) {
    const [isLoading, setIsLoading] = React.useState(initialState);
    const [error, setError] = React.useState<Error | null>(null);

    const withLoading = React.useCallback(
        async <T,>(promise: Promise<T>): Promise<T> => {
            setIsLoading(true);
            setError(null);
            try {
                const result = await promise;
                return result;
            } catch (err) {
                setError(err instanceof Error ? err : new Error(String(err)));
                throw err;
            } finally {
                setIsLoading(false);
            }
        },
        []
    );

    const reset = React.useCallback(() => {
        setIsLoading(initialState);
        setError(null);
    }, [initialState]);

    return { isLoading, setIsLoading, error, withLoading, reset };
}

/**
 * useDelayedLoading — Shows skeleton only if loading takes longer than `delay`.
 *
 * Prevents flash-of-skeleton for fast responses.
 *
 * @param isLoading - The actual loading state
 * @param delay - Minimum ms before showing skeleton (default: 200)
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const [loading, setLoading] = useState(true);
 *   const showSkeleton = useDelayedLoading(loading, 300);
 *
 *   return (
 *     <AutoSkeleton isLoading={showSkeleton}>
 *       <Content />
 *     </AutoSkeleton>
 *   );
 * }
 * ```
 */
export function useDelayedLoading(isLoading: boolean, delay = 200): boolean {
    const [showSkeleton, setShowSkeleton] = React.useState(false);

    React.useEffect(() => {
        if (!isLoading) {
            setShowSkeleton(false);
            return;
        }

        const timer = setTimeout(() => {
            setShowSkeleton(true);
        }, delay);

        return () => clearTimeout(timer);
    }, [isLoading, delay]);

    return showSkeleton;
}

/**
 * useMinimumLoadingTime — Ensures skeleton is shown for at least `minTime` ms.
 *
 * Prevents jarring flash when data loads instantly.
 *
 * @param isLoading - The actual loading state
 * @param minTime - Minimum display time in ms (default: 500)
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const [loading, setLoading] = useState(true);
 *   const showSkeleton = useMinimumLoadingTime(loading, 800);
 *
 *   return (
 *     <AutoSkeleton isLoading={showSkeleton}>
 *       <Content />
 *     </AutoSkeleton>
 *   );
 * }
 * ```
 */
export function useMinimumLoadingTime(isLoading: boolean, minTime = 500): boolean {
    const [showSkeleton, setShowSkeleton] = React.useState(isLoading);
    const startTimeRef = React.useRef<number | null>(null);

    React.useEffect(() => {
        if (isLoading) {
            startTimeRef.current = Date.now();
            setShowSkeleton(true);
            return;
        }

        // Loading just finished — check if we need to pad the time
        if (startTimeRef.current !== null) {
            const elapsed = Date.now() - startTimeRef.current;
            const remaining = minTime - elapsed;

            if (remaining > 0) {
                const timer = setTimeout(() => {
                    setShowSkeleton(false);
                    startTimeRef.current = null;
                }, remaining);
                return () => clearTimeout(timer);
            }
        }

        setShowSkeleton(false);
        startTimeRef.current = null;
    }, [isLoading, minTime]);

    return showSkeleton;
}

// ============================================================================
// INLINE SKELETON COMPONENT
// ============================================================================

/**
 * SkeletonBlock — A simple standalone skeleton block for manual use.
 *
 * Unlike AutoSkeleton which wraps real content, this creates a blank
 * skeleton placeholder of specified dimensions.
 *
 * @example
 * ```tsx
 * <SkeletonBlock width="100%" height="24px" borderRadius="md" />
 * <SkeletonBlock width={200} height={20} className="my-4" />
 * ```
 */
export interface SkeletonBlockProps {
    /** Width of the skeleton block */
    width?: string | number;
    /** Height of the skeleton block */
    height?: string | number;
    /** Custom className */
    className?: string;
    /** Border radius preset */
    borderRadius?: "sm" | "md" | "lg" | "full" | "none";
    /** Whether to animate */
    animate?: boolean;
    /** Animation variant */
    animationVariant?: "pulse" | "shimmer" | "wave" | "none";
    /** Custom style overrides */
    style?: CSSProperties;
}

export function SkeletonBlock({
    width = "100%",
    height = "1rem",
    className,
    borderRadius = "md",
    animate = true,
    animationVariant = "pulse",
    style,
}: SkeletonBlockProps): ReactNode {
    const animClass =
        animationVariant === "shimmer"
            ? "skeleton-shimmer"
            : animationVariant === "wave"
                ? "skeleton-wave"
                : animationVariant === "pulse" && animate
                    ? "animate-pulse"
                    : "";

    return (
        <div
            className={cx(
                "bg-muted",
                BORDER_RADIUS_MAP[borderRadius] || BORDER_RADIUS_MAP.md,
                animClass,
                className
            )}
            style={{
                width: typeof width === "number" ? `${width}px` : width,
                height: typeof height === "number" ? `${height}px` : height,
                ...style,
            }}
            aria-hidden="true"
            data-skeleton-type="block"
        />
    );
}

/**
 * SkeletonText — A standalone skeleton text line for manual use.
 *
 * @example
 * ```tsx
 * <SkeletonText lines={3} />
 * <SkeletonText lines={1} width="60%" />
 * ```
 */
export interface SkeletonTextProps {
    /** Number of text lines to render */
    lines?: number;
    /** Width of the last line (other lines are 100%) */
    lastLineWidth?: string;
    /** Width of all lines */
    width?: string;
    /** Custom className */
    className?: string;
    /** Line height */
    lineHeight?: string | number;
    /** Gap between lines */
    gap?: string | number;
    /** Whether to animate */
    animate?: boolean;
}

export function SkeletonText({
    lines = 1,
    lastLineWidth = "75%",
    width = "100%",
    className,
    lineHeight = "1rem",
    gap = "0.5rem",
    animate = true,
}: SkeletonTextProps): ReactNode {
    return (
        <div
            className={cx("flex flex-col", className)}
            style={{ gap: typeof gap === "number" ? `${gap}px` : gap }}
            aria-hidden="true"
            data-skeleton-type="text-block"
        >
            {Array.from({ length: lines }, (_, i) => (
                <div
                    key={i}
                    className={cx(
                        "bg-muted rounded",
                        animate && "animate-pulse"
                    )}
                    style={{
                        height: typeof lineHeight === "number" ? `${lineHeight}px` : lineHeight,
                        width: i === lines - 1 && lines > 1 ? lastLineWidth : width,
                    }}
                />
            ))}
        </div>
    );
}

// ============================================================================
// EXPORTS
// ============================================================================

export default AutoSkeleton;

// Re-export types for consumers
export type { SkeletonConfig };

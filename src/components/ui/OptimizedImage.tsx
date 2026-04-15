import Image, { type ImageProps } from "next/image";

type OptimizedImageProps = Omit<ImageProps, "alt"> & {
  alt: string;
};

/**
 * Next/Image wrapper with project defaults:
 *  - quality 85
 *  - responsive sizes appropriate for full-width hero or grid card
 *  - required alt (accessibility)
 *
 * Use `priority` only for above-the-fold hero images.
 */
export function OptimizedImage({
  sizes,
  quality = 85,
  alt,
  ...rest
}: OptimizedImageProps) {
  return (
    <Image
      alt={alt}
      quality={quality}
      sizes={
        sizes ??
        "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
      }
      {...rest}
    />
  );
}

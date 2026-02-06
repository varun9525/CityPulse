import * as React from "react"

const ImageWithFallback = ({
  src,
  alt,
  className,
  ...props
}: React.ImgHTMLAttributes<HTMLImageElement>) => {
  const [error, setError] = React.useState(false)

  React.useEffect(() => {
    setError(false)
  }, [src])

  if (error) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 text-gray-400 ${className}`}>
        <span className="text-sm">Image not available</span>
      </div>
    )
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={() => setError(true)}
      {...props}
    />
  )
}

export { ImageWithFallback }

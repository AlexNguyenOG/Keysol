interface BrandIconProps {
  brandId: string;
  name: string;
}

export function BrandIcon({ brandId, name }: BrandIconProps) {
  return (
    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-solana-purple/20 to-solana-green/20 p-2.5">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`/brands/${brandId}.svg`}
        alt={`${name} logo`}
        width={28}
        height={28}
        className="h-7 w-7 object-contain"
      />
    </div>
  );
}

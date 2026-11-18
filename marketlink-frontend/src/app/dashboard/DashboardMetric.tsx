import Link from 'next/link';

export default function DashboardMetric({
  href,
  title,
  value,
  detail,
  selected,
}: {
  href: string;
  title: string;
  value: number | null;
  detail?: string;
  selected?: boolean;
}) {
  return (
    <Link
      href={href}
      data-selected={selected || undefined}
      className="group flex min-w-0 items-baseline justify-between gap-4 px-4 py-4 hover:bg-slate-50 data-[selected=true]:bg-[#edf3ff] sm:flex-col sm:items-start sm:justify-start sm:gap-1"
    >
      <div>
        <h3 className="text-sm font-bold text-[#2455b5] underline-offset-4 group-hover:underline">{title}</h3>
        {selected ? <span className="sr-only">Filter applied</span> : null}
        {detail ? <p className="mt-1 text-sm leading-5 text-slate-600">{detail}</p> : null}
      </div>
      <span className="shrink-0 text-3xl font-extrabold tabular-nums text-[#192a48] sm:order-first">
        {value ?? <><span aria-hidden="true">—</span><span className="sr-only">Unavailable</span></>}
      </span>
    </Link>
  );
}

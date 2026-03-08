import ShareRedirect from "./ShareRedirect";

// Share tokens are unknown at build time; no static paths generated
export function generateStaticParams() {
  return [{ token: "_" }];
}

interface Props {
  params: Promise<{ token: string }>;
}

export default async function ShareRedirectPage({ params }: Props) {
  const { token } = await params;
  return <ShareRedirect token={token} />;
}

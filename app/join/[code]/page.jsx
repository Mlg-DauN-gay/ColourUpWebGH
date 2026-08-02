import JoinClient from "./JoinClient";

export default async function JoinCodePage({ params }) {
  const { code } = await params;
  return <JoinClient code={code} />;
}

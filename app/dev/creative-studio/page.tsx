import { notFound } from 'next/navigation';
import CreativeStudioFixture from './preview';

export default function CreativeStudioTestPage() {
  if (process.env.NODE_ENV !== 'development') notFound();
  return <CreativeStudioFixture />;
}

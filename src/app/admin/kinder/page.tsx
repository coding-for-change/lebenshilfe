import { KinderFacade } from "@/features/kinder";
import { KinderTable } from "@/features/kinder/components/kinder-table";
import { serializeChild } from "@/features/kinder/components/serialize";
import { KostentraegerFacade } from "@/features/kostentraeger";
import { SchulbegleiterFacade } from "@/features/schulbegleiter";

export default async function KinderPage() {
  const [children, kostentraeger, schulbegleiter] = await Promise.all([
    KinderFacade.list(),
    KostentraegerFacade.list(),
    SchulbegleiterFacade.list(),
  ]);

  return (
    <KinderTable
      kinder={children.map(serializeChild)}
      kostentraegerOptions={kostentraeger.map((k) => ({
        id: k.id,
        name: k.name,
      }))}
      schulbegleiterOptions={schulbegleiter
        .filter((p) => !!p.userId)
        .map((p) => ({ id: p.userId as string, name: p.name }))}
    />
  );
}

import ResourceGalleryView from '../components/resources/ResourceGalleryView';

export default function ReferencesPage() {
  return (
    <ResourceGalleryView
      title="Saved References"
      subtitle="External creative resource websites, stock packs, and inspiration URLs."
      filterMode="references"
      emptyTitle="No external references saved yet"
      emptyDescription="Use external references in Phase 3 to bookmark websites and large video packs without using your 1 GB storage quota."
    />
  );
}

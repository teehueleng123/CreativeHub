import ResourceGalleryView from '../components/resources/ResourceGalleryView';

export default function LibraryPage() {
  return (
    <ResourceGalleryView
      title="My Library"
      subtitle="All uploaded creative files and external references stored in your private cloud."
      filterMode="all"
      emptyTitle="No resources in your library yet"
      emptyDescription="File upload and external URL bookmarking will be enabled in Phase 3."
    />
  );
}

import ResourceGalleryView from '../components/resources/ResourceGalleryView';

export default function FavoritesPage() {
  return (
    <ResourceGalleryView
      title="Favourites"
      subtitle="Quick access to your starred assets and most-used creative references."
      filterMode="favorites"
      emptyTitle="No favourites yet"
      emptyDescription="Star any uploaded file or bookmark to pin it here for instant access."
    />
  );
}

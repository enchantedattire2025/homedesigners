import { supabase } from '../lib/supabase';

export const downloadFileFromStorage = async (url: string, filename: string = 'download') => {
  try {
    const urlParts = url.split('/storage/v1/object/public/');
    if (urlParts.length < 2) {
      throw new Error('Invalid storage URL');
    }

    const [bucketAndPath] = urlParts[1].split('?');
    const [bucketName, ...pathParts] = bucketAndPath.split('/');
    const filePath = pathParts.join('/');

    const { data, error } = await supabase.storage
      .from(bucketName)
      .download(filePath);

    if (error) {
      console.error('Download error:', error);
      throw error;
    }

    if (!data) {
      throw new Error('No data received');
    }

    const blob = new Blob([data], { type: data.type });
    const blobUrl = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(blobUrl);
  } catch (error: any) {
    console.error('Error downloading file:', error);
    alert('Failed to download file. Please try again or contact support.');
  }
};

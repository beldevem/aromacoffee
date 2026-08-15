import { BadRequestException, Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

type UploadFile = {
  buffer: Buffer;
  mimetype: string;
};

@Injectable()
export class SupabaseStorageService {
  private readonly client: SupabaseClient | null;
  private readonly bucket: string;

  constructor(config: ConfigService) {
    const url = config.get<string>('SUPABASE_URL');
    const serviceRoleKey = config.get<string>('SUPABASE_SERVICE_ROLE_KEY') ?? config.get<string>('SUPABASE_SECRET_KEY');
    this.bucket = config.get<string>('SUPABASE_STORAGE_BUCKET') ?? 'product-images';
    this.client = url && serviceRoleKey ? createClient(url, serviceRoleKey) : null;
  }

  async upload(slug: string, file: UploadFile): Promise<string> {
    const client = this.getClient();
    const extension = this.extensionFor(file.mimetype);
    const path = `products/${slug}.${extension}`;

    const { error: uploadError } = await client.storage.from(this.bucket).upload(path, file.buffer, {
      cacheControl: '3600',
      contentType: file.mimetype,
      upsert: true,
    });
    if (uploadError) throw new ServiceUnavailableException(`Image upload failed: ${uploadError.message}`);

    const { data } = client.storage.from(this.bucket).getPublicUrl(path);
    return data.publicUrl;
  }

  async remove(slug: string): Promise<void> {
    const client = this.getClient();
    const paths = ['jpg', 'jpeg', 'png', 'webp'].map((extension) => `products/${slug}.${extension}`);
    const { error } = await client.storage.from(this.bucket).remove(paths);
    if (error) throw new ServiceUnavailableException(`Image deletion failed: ${error.message}`);
  }

  private getClient(): SupabaseClient {
    if (!this.client) {
      throw new ServiceUnavailableException('Supabase Storage is not configured.');
    }
    return this.client;
  }

  private extensionFor(mimetype: string): string {
    const extensions: Record<string, string> = {
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/webp': 'webp',
    };
    const extension = extensions[mimetype];
    if (!extension) throw new BadRequestException('Only JPEG, PNG, and WebP images are supported.');
    return extension;
  }
}
import { getDatabase } from '@/services/database';
import { deleteImage } from '@/services/imageService';
import { CreateProductInput, Product, UpdateProductInput } from '@/types';

export async function getAllProducts(): Promise<Product[]> {
  const db = await getDatabase();
  return db.getAllAsync<Product>(
    `SELECT * FROM PRODUCTS ORDER BY supplier_name ASC, product_code ASC`
  );
}

export async function getProductById(id: number): Promise<Product | null> {
  const db = await getDatabase();
  return db.getFirstAsync<Product>(`SELECT * FROM PRODUCTS WHERE id = ?`, [id]);
}

export async function searchProducts(query: string): Promise<Product[]> {
  const db = await getDatabase();
  const q = `%${query.trim()}%`;
  return db.getAllAsync<Product>(
    `SELECT * FROM PRODUCTS
     WHERE product_code LIKE ?
        OR supplier_name LIKE ?
        OR description LIKE ?
     ORDER BY supplier_name ASC, product_code ASC`,
    [q, q, q]
  );
}

export async function createProduct(
  input: CreateProductInput,
  code: string
): Promise<Product> {
  const db = await getDatabase();
  const result = await db.runAsync(
    `INSERT INTO PRODUCTS
       (supplier_name, product_code, description, price, units_per_package,
        volume, weight, observations, image_uri)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      input.supplier_name,
      code,
      input.description ?? null,
      input.price,
      input.units_per_package,
      input.volume,
      input.weight,
      input.observations ?? null,
      input.image_uri,
    ]
  );

  const created = await getProductById(result.lastInsertRowId);
  if (!created) throw new Error('Failed to retrieve created product');
  return created;
}

export async function updateProduct(
  id: number,
  input: UpdateProductInput
): Promise<Product | null> {
  const db = await getDatabase();
  await db.runAsync(
    `UPDATE PRODUCTS SET
       supplier_name     = COALESCE(?, supplier_name),
       description       = COALESCE(?, description),
       price             = COALESCE(?, price),
       units_per_package = COALESCE(?, units_per_package),
       volume            = COALESCE(?, volume),
       weight            = COALESCE(?, weight),
       observations      = COALESCE(?, observations),
       image_uri         = COALESCE(?, image_uri),
       updated_at        = datetime('now')
     WHERE id = ?`,
    [
      input.supplier_name ?? null,
      input.description ?? null,
      input.price ?? null,
      input.units_per_package ?? null,
      input.volume ?? null,
      input.weight ?? null,
      input.observations ?? null,
      input.image_uri ?? null,
      id,
    ]
  );
  return getProductById(id);
}

export async function deleteProduct(id: number): Promise<void> {
  const db = await getDatabase();
  const product = await getProductById(id);
  if (!product) return;

  await db.runAsync(`DELETE FROM PRODUCTS WHERE id = ?`, [id]);
  await deleteImage(product.image_uri);
}

export async function deleteProducts(ids: number[]): Promise<void> {
  const db = await getDatabase();

  // Fetch all image URIs before deletion
  const placeholders = ids.map(() => '?').join(', ');
  const products = await db.getAllAsync<Product>(
    `SELECT * FROM PRODUCTS WHERE id IN (${placeholders})`,
    ids
  );

  // Delete in a single transaction
  await db.withTransactionAsync(async () => {
    await db.runAsync(
      `DELETE FROM PRODUCTS WHERE id IN (${placeholders})`,
      ids
    );
  });

  // Clean up images after successful DB deletion
  await Promise.allSettled(products.map((p) => deleteImage(p.image_uri)));
}

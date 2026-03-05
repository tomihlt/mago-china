import { getDatabase } from '@/services/database';
import { deleteImage } from '@/services/imageService';
import { CreateProductInput, Product, UpdateProductInput } from '@/types';

export async function getAllProducts(limit: number = 20, offset: number = 0): Promise<Product[]> {
  const db = await getDatabase();
  return db.getAllAsync<Product>(
    `SELECT * FROM PRODUCTS ORDER BY supplier_name ASC, product_code ASC LIMIT ? OFFSET ?`,
    [limit, offset]
  );
}

/**
 * Retrieves ALL products from the database without any LIMIT or OFFSET.
 * Use this function exclusively for export operations (e.g. Excel export).
 * Do NOT use for UI listing — use getAllProducts() with pagination instead.
 */
export async function getAllProductsForExport(): Promise<Product[]> {
  const db = await getDatabase();
  return db.getAllAsync<Product>(
    `SELECT * FROM PRODUCTS ORDER BY supplier_name ASC, product_code ASC`
  );
}

export async function getProductById(id: number): Promise<Product | null> {
  const db = await getDatabase();
  return db.getFirstAsync<Product>(`SELECT * FROM PRODUCTS WHERE id = ?`, [id]);
}

/**
 * Checks if a product code already exists in the database.
 * Used to validate manually entered codes before saving.
 */
export async function getProductByCode(
  code: string
): Promise<Product | null> {
  const db = await getDatabase();
  return db.getFirstAsync<Product>(
    `SELECT * FROM PRODUCTS WHERE UPPER(product_code) = UPPER(?)`,
    [code]
  );
}

/**
 * Smart search:
 * - Case-insensitive (UPPER) across supplier_name and product_code
 * - If query is all digits, also matches codes where the digit sequence
 *   appears anywhere in the numeric portion (e.g. "15" → "EM-0015", "EM-15")
 */
export async function searchProducts(query: string, limit: number = 20, offset: number = 0): Promise<Product[]> {
  const db = await getDatabase();
  const trimmed = query.trim();
  const upper = trimmed.toUpperCase();
  const like = `%${upper}%`;

  // If the query contains only digits, also do a numeric-flexible match
  // by stripping non-digits from the product_code and comparing
  const isNumericOnly = /^\d+$/.test(trimmed);

  if (isNumericOnly) {
    // Numeric search: '15' should match 'EM-0015', 'EM-15', 'TEST-0015'
    // UPPER(product_code) LIKE '%15%' already matches 'EM-0015' since '0015' contains '15'
    // Also try zero-padded variant (e.g. '15' → '0015') for 4-digit sequences
    const paddedLike = `%${trimmed.padStart(Math.max(4, trimmed.length), '0')}%`;
    return db.getAllAsync<Product>(
      `SELECT * FROM PRODUCTS
       WHERE UPPER(supplier_name) LIKE ?
          OR UPPER(product_code) LIKE ?
          OR UPPER(product_code) LIKE ?
          OR UPPER(description) LIKE ?
       ORDER BY supplier_name ASC, product_code ASC LIMIT ? OFFSET ?`,
      [like, like, paddedLike, like, limit, offset]
    );
  }

  return db.getAllAsync<Product>(
    `SELECT * FROM PRODUCTS
     WHERE UPPER(supplier_name) LIKE ?
        OR UPPER(product_code) LIKE ?
        OR UPPER(description) LIKE ?
     ORDER BY supplier_name ASC, product_code ASC LIMIT ? OFFSET ?`,
    [like, like, like, limit, offset]
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

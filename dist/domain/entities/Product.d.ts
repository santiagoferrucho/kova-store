export interface Category {
    id: number;
    name: string;
    slug: string;
    description?: string;
    created_at?: string;
}
export interface Product {
    id: number;
    sku: string;
    name: string;
    description?: string;
    price: number;
    stock: number;
    image_url?: string;
    is_active: number;
    created_at: string;
    updated_at: string;
}
export interface ProductWithMeta extends Product {
    categories: Category[];
    avg_rating: number | null;
    review_count: number;
}
//# sourceMappingURL=Product.d.ts.map
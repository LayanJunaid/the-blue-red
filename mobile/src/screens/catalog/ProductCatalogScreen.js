import { useEffect, useMemo, useState } from "react";
import { FlatList, Text, TextInput, View } from "react-native";
import ProductCard from "../../components/cards/ProductCard";
import { getProducts } from "../../services/productService";
import { colors } from "../../theme/colors";

export default function ProductCatalogScreen() {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    getProducts().then(setProducts).catch(console.log);
  }, []);

  const filteredProducts = useMemo(() => {
    const q = search.toLowerCase();

    return products.filter((product) => {
      return (
        product.name_tr?.toLowerCase().includes(q) ||
        product.product_id?.toLowerCase().includes(q) ||
        product.sku?.toLowerCase().includes(q) ||
        product.category?.toLowerCase().includes(q)
      );
    });
  }, [products, search]);

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.background,
        padding: 20,
        paddingTop: 58,
      }}
    >
      <Text style={{ color: colors.text, fontSize: 30, fontWeight: "900" }}>
        Products
      </Text>

      <Text style={{ color: colors.muted, marginTop: 6 }}>
        Search products, stock and prices.
      </Text>

      <TextInput
        value={search}
        onChangeText={setSearch}
        placeholder="Search product..."
        placeholderTextColor="#64748B"
        style={{
          marginTop: 22,
          backgroundColor: colors.surface,
          borderColor: colors.border,
          borderWidth: 1,
          borderRadius: 20,
          padding: 15,
          color: colors.text,
        }}
      />

      <FlatList
        data={filteredProducts}
        keyExtractor={(item) => item.product_id}
        contentContainerStyle={{ gap: 14, paddingTop: 18, paddingBottom: 24 }}
        renderItem={({ item }) => <ProductCard product={item} />}
      />
    </View>
  );
}
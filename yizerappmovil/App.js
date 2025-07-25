import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  TextInput,
  Modal,
  Dimensions,
  Alert // Using Alert for simple messages as per general React Native practice, though a custom modal is preferred for production.
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

// Componente de botón reutilizable
const CustomButton = ({ title, onPress, style, textStyle, disabled = false }) => (
  <TouchableOpacity
    style={[styles.button, style, disabled && styles.buttonDisabled]}
    onPress={onPress}
    disabled={disabled}
    activeOpacity={0.7} // Added for better press feedback
  >
    <Text style={[styles.buttonText, textStyle]}>{title}</Text>
  </TouchableOpacity>
);

// Componente de encabezado con menú
const Header = ({ onMenuPress }) => (
  <View style={styles.header}>
    <TouchableOpacity onPress={onMenuPress} style={styles.menuIcon}>
      <Text style={styles.menuText}>☰</Text>
    </TouchableOpacity>
    <Text style={styles.headerTitle}>YIZER</Text>
    <View style={{ width: 30 }} /> {/* Spacer to center the title */}
  </View>
);

const App = () => {
  const [screen, setScreen] = useState('home'); // 'home', 'product', 'myOrders', 'login', 'register', 'recovery', 'personalization', 'authSelection'
  const [selectedProduct, setSelectedProduct] = useState(null); // Used for default products on home screen
  const [currentCartItems, setCurrentCartItems] = useState([]); // Items currently in the cart before purchase
  const [pastOrders, setPastOrders] = useState([]); // Completed orders for tracking
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // States for customizing a new product
  const [selectedBaseProductForCustomization, setSelectedBaseProductForCustomization] = useState(null);
  const [customizationOptions, setCustomizationOptions] = useState({
    size: 'M',
    color: 'Blanco',
    quantity: 1,
    printPosition: 'Centro Frontal',
    printSize: 'Mediano',
    printImage: 'https://placehold.co/100x100/FFD700/000?text=Estampado' // Placeholder for the print
  });

  // Example product data
  const products = [
    {
      id: '1',
      name: 'Sudadera Grande',
      price: '250',
      image: 'https://placehold.co/300x300/B12A2A/FFFFFF?text=Sudadera',
      description: 'Sudadera de algodón suave y cómoda, ideal para cualquier ocasión. Disponible en varios colores y tallas.',
      availableColors: ['Rojo', 'Negro', 'Blanco', 'Gris'],
      availableSizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL']
    },
    {
      id: '2',
      name: 'Chaqueta Urbana',
      price: '320',
      image: 'https://placehold.co/300x300/B12A2A/FFFFFF?text=Chaqueta',
      description: 'Chaqueta moderna con diseño urbano, perfecta para el día a día. Fabricada con materiales de alta calidad.',
      availableColors: ['Azul', 'Verde', 'Negro'],
      availableSizes: ['S', 'M', 'L', 'XL']
    },
    {
      id: '3',
      name: 'Camiseta Básica',
      price: '180',
      image: 'https://placehold.co/300x300/B12A2A/FFFFFF?text=Camiseta',
      description: 'Camiseta de algodón 100%, ligera y transpirable. Un básico indispensable en tu armario.',
      availableColors: ['Blanco', 'Negro', 'Azul Claro', 'Rosa'],
      availableSizes: ['XS', 'S', 'M', 'L', 'XL']
    },
  ];

  // Available customization options (general)
  const printPositions = ['Centro Frontal', 'Superior Izquierdo', 'Superior Derecho', 'Espalda Centro'];
  const printSizes = ['Pequeño', 'Mediano', 'Grande'];

  useEffect(() => {
    // When a new base product for customization is selected, reset the options
    if (selectedBaseProductForCustomization) {
      setCustomizationOptions({
        size: selectedBaseProductForCustomization.availableSizes[0] || 'M',
        color: selectedBaseProductForCustomization.availableColors[0] || 'Blanco',
        quantity: 1,
        printPosition: printPositions[0],
        printSize: printSizes[0],
        printImage: 'https://placehold.co/100x100/FFD700/000?text=Estampado'
      });
    }
  }, [selectedBaseProductForCustomization]);

  const addToCart = (productToAdd) => {
    setCurrentCartItems((prevItems) => {
      // Check if an identical customized product already exists in the cart
      const existingItemIndex = prevItems.findIndex(
        (item) =>
          item.id === productToAdd.id &&
          item.customization && productToAdd.customization && // Ensure customization exists on both
          item.customization.size === productToAdd.customization.size &&
          item.customization.color === productToAdd.customization.color &&
          item.customization.printPosition === productToAdd.customization.printPosition &&
          item.customization.printSize === productToAdd.customization.printSize
      );

      if (existingItemIndex > -1) {
        const updatedItems = [...prevItems];
        updatedItems[existingItemIndex].quantity += productToAdd.quantity;
        return updatedItems;
      }
      return [...prevItems, productToAdd];
    });
    // For now, we'll still go to a 'cart' view, but it's the pre-purchase cart.
    setScreen('myOrders'); // Direct to myOrders to show the current order as "pending"
  };

  const removeFromCart = (itemToRemove) => {
    setCurrentCartItems((prevItems) =>
      prevItems.filter(
        (item) =>
          !(
            item.id === itemToRemove.id &&
            item.customization && itemToRemove.customization &&
            item.customization.size === itemToRemove.customization.size &&
            item.customization.color === itemToRemove.customization.color &&
            item.customization.printPosition === itemToRemove.customization.printPosition &&
            item.customization.printSize === itemToRemove.customization.printSize
          )
      )
    );
  };

  const getTotalCartPrice = () => {
    return currentCartItems.reduce((total, item) => total + parseFloat(item.price) * item.quantity, 0);
  };

  const handlePurchase = () => {
    if (currentCartItems.length === 0) {
      Alert.alert("Carrito Vacío", "No hay productos en el carrito para confirmar la compra.");
      return;
    }

    // Simulate a purchase: move current cart items to past orders
    const newOrder = {
      orderId: `ORD-${Date.now()}`,
      items: [...currentCartItems],
      orderDate: new Date().toLocaleDateString('es-ES'),
      status: 'Confirmado',
      estimatedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('es-ES'), // 7 days from now
      totalPrice: getTotalCartPrice(),
    };

    setPastOrders((prevOrders) => [...prevOrders, newOrder]);
    setCurrentCartItems([]); // Clear the current cart
    setShowSuccessModal(true);
  };

  const handleCloseSuccessModal = () => {
    setShowSuccessModal(false);
    setScreen('myOrders'); // Go to my orders screen after successful purchase
  };

  const updateCustomization = (key, value) => {
    setCustomizationOptions((prev) => ({ ...prev, [key]: value }));
  };

  const handleConfirmCustomization = () => {
    if (!selectedBaseProductForCustomization) return;

    const customizedProduct = {
      ...selectedBaseProductForCustomization,
      // Assign a unique ID for customized products if needed, or use a combination of base ID and customization details
      id: `${selectedBaseProductForCustomization.id}-${Date.now()}`, // Unique ID for this specific customization
      quantity: customizationOptions.quantity,
      customization: { ...customizationOptions },
      // Adjust price if customization implies it (e.g., for print size, etc.)
      // For now, the base price remains.
    };
    addToCart(customizedProduct);
    setSelectedBaseProductForCustomization(null); // Reset for next customization
  };

  const renderHomeScreen = () => (
    <View style={styles.container}>
      <Header onMenuPress={() => setIsMenuOpen(true)} />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>YIZER</Text>
        <Text style={styles.subtitle}>Personaliza tu mundo con estilo.</Text>

        <CustomButton
          title="Iniciar Sesión"
          onPress={() => setScreen('authSelection')} // Navigate to auth selection
          style={styles.heroButton}
        />
        <CustomButton
          title="Registrarse"
          onPress={() => setScreen('authSelection')} // Navigate to auth selection
          style={styles.heroButton}
        />

        <View style={styles.productGrid}>
          {products.map((product) => (
            <TouchableOpacity
              key={product.id}
              style={styles.productCard}
              onPress={() => {
                setSelectedProduct(product);
                setScreen('product');
              }}
            >
              <Image source={{ uri: product.image }} style={styles.productImage} />
              <Text style={styles.productName}>{product.name}</Text>
              <Text style={styles.productPrice}>${product.price}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );

  const renderProductScreen = () => (
    <View style={styles.container}>
      <Header onMenuPress={() => setIsMenuOpen(true)} />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {selectedProduct && (
          <View style={styles.productDetailContainer}>
            <Image source={{ uri: selectedProduct.image }} style={styles.productDetailImage} />
            <Text style={styles.productDetailName}>{selectedProduct.name}</Text>
            <Text style={styles.productDetailPrice}>${selectedProduct.price}</Text>
            <Text style={styles.productDetailDescription}>{selectedProduct.description}</Text>

            {/* Only "Add to Cart" for pre-made products */}
            <CustomButton
              title="Añadir al Carrito"
              onPress={() => {
                // For pre-made products, customization is null
                setCurrentCartItems((prevItems) => {
                  const existingItemIndex = prevItems.findIndex(
                    (item) => item.id === selectedProduct.id && item.customization === null
                  );
                  if (existingItemIndex > -1) {
                    const updatedItems = [...prevItems];
                    updatedItems[existingItemIndex].quantity += 1;
                    return updatedItems;
                  }
                  return [...prevItems, { ...selectedProduct, quantity: 1, customization: null }];
                });
                setScreen('myOrders'); // After adding, go to my orders to see it as a pending item
              }}
              style={styles.addToCartButton}
            />
            <CustomButton
              title="Volver"
              onPress={() => setScreen('home')}
              style={styles.backButton}
            />
          </View>
        )}
      </ScrollView>
    </View>
  );

  const renderPersonalizationScreen = () => {
    // Logic for print position and size in the preview
    const printStyle = {};
    const printSizeMap = {
      'Pequeño': { width: 50, height: 50 },
      'Mediano': { width: 80, height: 80 },
      'Grande': { width: 120, height: 120 },
    };
    const currentPrintSize = printSizeMap[customizationOptions.printSize] || printSizeMap['Mediano'];

    switch (customizationOptions.printPosition) {
      case 'Centro Frontal':
        printStyle.alignSelf = 'center';
        printStyle.top = '40%'; // Approximate
        break;
      case 'Superior Izquierdo':
        printStyle.alignSelf = 'flex-start';
        printStyle.top = '10%';
        printStyle.left = '10%';
        break;
      case 'Superior Derecho':
        printStyle.alignSelf = 'flex-end';
        printStyle.top = '10%';
        printStyle.right = '10%';
        break;
      case 'Espalda Centro':
        printStyle.alignSelf = 'center';
        printStyle.top = '40%'; // Assuming the image is generic and can represent the back
        break;
      default:
        printStyle.alignSelf = 'center';
        printStyle.top = '40%';
    }

    const getProductImageColor = (colorName) => {
      // Simple mapping of colors to placeholder URLs
      const colorMap = {
        'Rojo': 'B12A2A',
        'Negro': '000000',
        'Blanco': 'FFFFFF',
        'Gris': '808080',
        'Azul': '0000FF',
        'Verde': '008000', // Corrected: removed extra single quote
        'Azul Claro': 'ADD8E6',
        'Rosa': 'FFC0CB',
      };
      const hexColor = colorMap[colorName] || 'B12A2A'; // Default to red
      // Use the name of the selected base product for the placeholder text
      const productNameForPlaceholder = selectedBaseProductForCustomization ? selectedBaseProductForCustomization.name.split(' ')[0] : 'Producto';
      return `https://placehold.co/300x300/${hexColor}/FFFFFF?text=${productNameForPlaceholder}`;
    };

    if (!selectedBaseProductForCustomization) {
      return (
        <View style={styles.container}>
          <Header onMenuPress={() => setIsMenuOpen(true)} />
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <Text style={styles.screenTitle}>Elige un Producto para Personalizar</Text>
            <View style={styles.productGrid}>
              {products.map((product) => (
                <TouchableOpacity
                  key={product.id}
                  style={styles.productCard}
                  onPress={() => setSelectedBaseProductForCustomization(product)}
                >
                  <Image source={{ uri: product.image }} style={styles.productImage} />
                  <Text style={styles.productName}>{product.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <CustomButton
              title="Volver al Inicio"
              onPress={() => setScreen('home')}
              style={styles.backButton}
            />
          </ScrollView>
        </View>
      );
    }

    return (
      <View style={styles.container}>
        <Header onMenuPress={() => setIsMenuOpen(true)} />
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={styles.screenTitle}>Personalizar {selectedBaseProductForCustomization.name}</Text>

          {/* Preview */}
          <View style={styles.previewContainer}>
            <Image
              source={{ uri: getProductImageColor(customizationOptions.color) }}
              style={styles.previewProductImage}
            />
            <Image
              source={{ uri: customizationOptions.printImage }}
              style={[styles.previewPrintImage, printStyle, currentPrintSize]}
            />
          </View>

          {/* Customization Options */}
          <View style={styles.customizationOptionsContainer}>
            <Text style={styles.optionTitle}>Talla:</Text>
            <View style={styles.optionRow}>
              {selectedBaseProductForCustomization.availableSizes.map((size) => (
                <CustomButton
                  key={size}
                  title={size}
                  onPress={() => updateCustomization('size', size)}
                  style={[
                    styles.optionButton,
                    customizationOptions.size === size && styles.optionButtonSelected,
                  ]}
                  textStyle={styles.optionButtonText}
                />
              ))}
            </View>

            <Text style={styles.optionTitle}>Color:</Text>
            <View style={styles.optionRow}>
              {selectedBaseProductForCustomization.availableColors.map((color) => (
                <TouchableOpacity
                  key={color}
                  style={[
                    styles.colorSwatch,
                    { backgroundColor: color.toLowerCase().replace(' ', '') }, // Simple mapping for common colors
                    customizationOptions.color === color && styles.colorSwatchSelected,
                  ]}
                  onPress={() => updateCustomization('color', color)}
                />
              ))}
            </View>

            <Text style={styles.optionTitle}>Cantidad:</Text>
            <View style={styles.quantityContainer}>
              <CustomButton
                title="-"
                onPress={() => updateCustomization('quantity', Math.max(1, customizationOptions.quantity - 1))}
                style={styles.quantityButton}
                textStyle={styles.quantityButtonText}
              />
              <Text style={styles.quantityText}>{customizationOptions.quantity}</Text>
              <CustomButton
                title="+"
                onPress={() => updateCustomization('quantity', customizationOptions.quantity + 1)}
                style={styles.quantityButton}
                textStyle={styles.quantityButtonText}
              />
            </View>

            <Text style={styles.optionTitle}>Posición del Estampado:</Text>
            <View style={styles.optionRow}>
              {printPositions.map((position) => (
                <CustomButton
                  key={position}
                  title={position}
                  onPress={() => updateCustomization('printPosition', position)}
                  style={[
                    styles.optionButton,
                    customizationOptions.printPosition === position && styles.optionButtonSelected,
                  ]}
                  textStyle={styles.optionButtonText}
                />
              ))}
            </View>

            <Text style={styles.optionTitle}>Tamaño del Estampado:</Text>
            <View style={styles.optionRow}>
              {printSizes.map((size) => (
                <CustomButton
                  key={size}
                  title={size}
                  onPress={() => updateCustomization('printSize', size)}
                  style={[
                    styles.optionButton,
                    customizationOptions.printSize === size && styles.optionButtonSelected,
                  ]}
                  textStyle={styles.optionButtonText}
                />
              ))}
            </View>
            {/* Future improvement: Add an option to upload a custom print image here */}
            {/* <Text style={styles.optionTitle}>Subir Estampado:</Text>
            <CustomButton
              title="Seleccionar Imagen"
              onPress={() => Alert.alert("Funcionalidad Pendiente", "La carga de imágenes aún no está implementada.")}
              style={styles.uploadImageButton}
            /> */}
          </View>

          {/* Action Buttons */}
          <CustomButton
            title="Confirmar Producto"
            onPress={handleConfirmCustomization}
            style={styles.confirmCustomizationButton}
          />
          <CustomButton
            title="Modificar Diseño"
            onPress={() => {
              Alert.alert("Modificar Diseño", "Puedes ajustar las opciones de personalización arriba.");
            }}
            style={styles.modifyDesignButton}
          />
          <CustomButton
            title="Volver a Elegir Producto"
            onPress={() => setSelectedBaseProductForCustomization(null)}
            style={styles.backButton}
          />
        </ScrollView>
      </View>
    );
  };

  const renderMyOrdersScreen = () => (
    <View style={styles.container}>
      <Header onMenuPress={() => setIsMenuOpen(true)} />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.screenTitle}>Mi Compra</Text>

        {/* Current Cart Items (Pending Purchase) */}
        {currentCartItems.length > 0 && (
          <View style={styles.currentCartSection}>
            <Text style={styles.sectionTitle}>Productos Pendientes de Confirmar:</Text>
            {currentCartItems.map((item, index) => (
              <View key={`${item.id}-${index}-current`} style={styles.cartItem}>
                <Image source={{ uri: item.image }} style={styles.cartItemImage} />
                <View style={styles.cartItemDetails}>
                  <Text style={styles.cartItemName}>{item.name}</Text>
                  {item.customization && (
                    <View>
                      <Text style={styles.cartItemCustomization}>Talla: {item.customization.size}</Text>
                      <Text style={styles.cartItemCustomization}>Color: {item.customization.color}</Text>
                      <Text style={styles.cartItemCustomization}>Estampado: {item.customization.printPosition} ({item.customization.printSize})</Text>
                    </View>
                  )}
                  <Text style={styles.cartItemPrice}>${item.price} x {item.quantity}</Text>
                  <Text style={styles.cartItemPrice}>Total: ${parseFloat(item.price) * item.quantity}</Text>
                </View>
                <CustomButton
                  title="Eliminar"
                  onPress={() => removeFromCart(item)}
                  style={styles.removeButton}
                  textStyle={styles.removeButtonText}
                />
              </View>
            ))}
            <Text style={styles.totalPrice}>Total Pendiente: ${getTotalCartPrice()}</Text>
            <CustomButton
              title="Confirmar Compra"
              onPress={handlePurchase}
              style={styles.confirmPurchaseButton}
            />
          </View>
        )}

        {/* Past Orders (Tracking) */}
        <Text style={styles.sectionTitle}>Mis Pedidos Anteriores:</Text>
        {pastOrders.length === 0 ? (
          <Text style={styles.emptyCartText}>No has realizado ningún pedido aún.</Text>
        ) : (
          pastOrders.map((order, orderIndex) => (
            <View key={order.orderId} style={styles.orderCard}>
              <Text style={styles.orderId}>Pedido #{order.orderId}</Text>
              <Text style={styles.orderInfo}>Fecha del Pedido: {order.orderDate}</Text>
              <Text style={styles.orderInfo}>Estado: <Text style={styles.orderStatus}>{order.status}</Text></Text>
              <Text style={styles.orderInfo}>Entrega Estimada: {order.estimatedDelivery}</Text>
              <Text style={styles.orderTotal}>Total: ${order.totalPrice}</Text>
              <View style={styles.orderItemsContainer}>
                {order.items.map((item, itemIndex) => (
                  <View key={`${item.id}-${itemIndex}-order-item`} style={styles.orderItem}>
                    <Image source={{ uri: item.image }} style={styles.orderItemImage} />
                    <View style={styles.orderItemDetails}>
                      <Text style={styles.orderItemName}>{item.name}</Text>
                      {item.customization && (
                        <View>
                          <Text style={styles.orderItemCustomization}>Talla: {item.customization.size}</Text>
                          <Text style={styles.orderItemCustomization}>Color: {item.customization.color}</Text>
                          <Text style={styles.orderItemCustomization}>Estampado: {item.customization.printPosition} ({item.customization.printSize})</Text>
                        </View>
                      )}
                      <Text style={styles.orderItemPrice}>${item.price} x {item.quantity}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          ))
        )}
        <CustomButton
          title="Seguir Comprando"
          onPress={() => setScreen('home')}
          style={styles.backButton}
        />
      </ScrollView>

      {/* Success Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showSuccessModal}
        onRequestClose={handleCloseSuccessModal}
      >
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            <Text style={styles.modalTitle}>¡Compra exitosa!</Text>
            <Text style={styles.modalText}>Tu pedido ha sido procesado.</Text>
            <Image
              source={{ uri: 'https://placehold.co/100x100/B12A2A/FFFFFF?text=✓' }}
              style={styles.successImage}
            />
            <CustomButton
              title="Aceptar"
              onPress={handleCloseSuccessModal}
              style={styles.modalButton}
            />
          </View>
        </View>
      </Modal>
    </View>
  );

  const renderAuthSelectionScreen = () => (
    <View style={styles.container}>
      <Header onMenuPress={() => setIsMenuOpen(true)} />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.screenTitle}>Bienvenido a YIZER</Text>
        <Text style={styles.subtitle}>Elige una opción para continuar.</Text>

        <CustomButton
          title="Iniciar Sesión"
          onPress={() => setScreen('login')}
          style={styles.authSelectionButton}
        />
        <CustomButton
          title="Registrarse"
          onPress={() => setScreen('register')}
          style={styles.authSelectionButton}
        />
        <CustomButton
          title="Recuperar Contraseña"
          onPress={() => setScreen('recovery')}
          style={styles.authSelectionButton}
        />
        <CustomButton
          title="Volver al Inicio"
          onPress={() => setScreen('home')}
          style={styles.backButton}
        />
      </ScrollView>
    </View>
  );

  const renderLoginScreen = () => (
    <View style={styles.container}>
      <Header onMenuPress={() => setIsMenuOpen(true)} />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.screenTitle}>Iniciar Sesión</Text>
        <TextInput
          style={styles.input}
          placeholder="Correo electrónico"
          keyboardType="email-address"
          autoCapitalize="none"
          placeholderTextColor="#aaa"
        />
        <TextInput
          style={styles.input}
          placeholder="Contraseña"
          secureTextEntry
          placeholderTextColor="#aaa"
        />
        <CustomButton
          title="Entrar"
          onPress={() => {
            // Logic for login
            Alert.alert("Inicio de Sesión", "Funcionalidad de inicio de sesión simulada.");
            setScreen('home');
          }}
          style={styles.authButton}
        />
        <TouchableOpacity onPress={() => setScreen('recovery')}>
          <Text style={styles.linkText}>¿Olvidaste tu contraseña?</Text>
        </TouchableOpacity>
        <CustomButton
          title="Volver"
          onPress={() => setScreen('authSelection')} // Go back to auth selection
          style={styles.backButton}
        />
      </ScrollView>
    </View>
  );

  const renderRegisterScreen = () => (
    <View style={styles.container}>
      <Header onMenuPress={() => setIsMenuOpen(true)} />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.screenTitle}>Registrarse</Text>
        <TextInput
          style={styles.input}
          placeholder="Nombre de usuario"
          placeholderTextColor="#aaa"
        />
        <TextInput
          style={styles.input}
          placeholder="Correo electrónico"
          keyboardType="email-address"
          autoCapitalize="none"
          placeholderTextColor="#aaa"
        />
        <TextInput
          style={styles.input}
          placeholder="Contraseña"
          secureTextEntry
          placeholderTextColor="#aaa"
        />
        <TextInput
          style={styles.input}
          placeholder="Confirmar Contraseña"
          secureTextEntry
          placeholderTextColor="#aaa"
        />
        <CustomButton
          title="Registrar"
          onPress={() => {
            // Logic for registration
            Alert.alert("Registro", "Funcionalidad de registro simulada.");
            setScreen('home');
          }}
          style={styles.authButton}
        />
        <CustomButton
          title="Volver"
          onPress={() => setScreen('authSelection')} // Go back to auth selection
          style={styles.backButton}
        />
      </ScrollView>
    </View>
  );

  const renderRecoveryScreen = () => (
    <View style={styles.container}>
      <Header onMenuPress={() => setIsMenuOpen(true)} />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.screenTitle}>Recuperar Contraseña</Text>
        <TextInput
          style={styles.input}
          placeholder="Correo electrónico"
          keyboardType="email-address"
          autoCapitalize="none"
          placeholderTextColor="#aaa"
        />
        <CustomButton
          title="Enviar Contraseña"
          onPress={() => {
            // Logic to send password
            Alert.alert("Recuperación", "Se ha enviado un enlace de recuperación a tu correo.");
            setScreen('login');
          }}
          style={styles.authButton}
        />
        <CustomButton
          title="Volver"
          onPress={() => setScreen('authSelection')} // Go back to auth selection
          style={styles.backButton}
        />
      </ScrollView>
    </View>
  );

  const renderMenu = () => (
    <Modal
      animationType="fade"
      transparent={true}
      visible={isMenuOpen}
      onRequestClose={() => setIsMenuOpen(false)}
    >
      <TouchableOpacity
        style={styles.menuOverlay}
        activeOpacity={1}
        onPressOut={() => setIsMenuOpen(false)}
      >
        <View style={styles.menuContainer}>
          <TouchableOpacity style={styles.menuItem} onPress={() => { setScreen('home'); setIsMenuOpen(false); }}>
            <Text style={styles.menuItemText}>INICIO</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem} onPress={() => { setScreen('myOrders'); setIsMenuOpen(false); }}>
            <Text style={styles.menuItemText}>MI COMPRA</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem} onPress={() => { setScreen('personalization'); setIsMenuOpen(false); setSelectedBaseProductForCustomization(null); }}>
            <Text style={styles.menuItemText}>PERSONALIZACIONES</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem} onPress={() => { setScreen('authSelection'); setIsMenuOpen(false); }}>
            <Text style={styles.menuItemText}>AUTENTICACIÓN</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      {screen === 'home' && renderHomeScreen()}
      {screen === 'product' && renderProductScreen()}
      {screen === 'myOrders' && renderMyOrdersScreen()}
      {screen === 'login' && renderLoginScreen()}
      {screen === 'register' && renderRegisterScreen()}
      {screen === 'recovery' && renderRecoveryScreen()}
      {screen === 'personalization' && renderPersonalizationScreen()}
      {screen === 'authSelection' && renderAuthSelectionScreen()}
      {renderMenu()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#222', // Slightly darker background for more contrast
  },
  container: {
    flex: 1,
    backgroundColor: '#222',
  },
  scrollContent: {
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 15,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#B12A2A', // Dark red
    paddingVertical: 18, // Slightly more padding
    paddingHorizontal: 15,
    width: '100%',
    shadowColor: '#000', // Shadow for header
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 10,
  },
  menuIcon: {
    padding: 5,
  },
  menuText: {
    fontSize: 28, // Larger icon
    color: '#fff',
    fontWeight: 'bold',
  },
  headerTitle: {
    fontSize: 32, // Larger title
    fontWeight: 'bold',
    color: '#fff',
    letterSpacing: 3, // More letter spacing
    textShadowColor: 'rgba(0, 0, 0, 0.2)', // Subtle text shadow
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  title: {
    fontSize: 52, // Even larger title
    fontWeight: 'bold',
    color: '#B12A2A',
    marginTop: 30,
    marginBottom: 10,
    letterSpacing: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 3,
  },
  subtitle: {
    fontSize: 19, // Slightly larger subtitle
    color: '#eee', // Lighter text color
    marginBottom: 40,
    textAlign: 'center',
    lineHeight: 25,
  },
  button: {
    backgroundColor: '#B12A2A',
    paddingVertical: 14, // More vertical padding
    paddingHorizontal: 30,
    borderRadius: 12, // More rounded corners
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 }, // Stronger shadow
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 12,
    borderWidth: 1, // Subtle border
    borderColor: 'rgba(255,255,255,0.2)',
  },
  buttonDisabled: {
    backgroundColor: '#666', // Darker disabled button
    borderColor: 'rgba(255,255,255,0.1)',
    shadowOpacity: 0.1,
    elevation: 3,
  },
  buttonText: {
    color: '#fff',
    fontSize: 19, // Slightly larger text
    fontWeight: 'bold',
    textTransform: 'uppercase', // Uppercase text
  },
  heroButton: {
    width: '85%', // Wider buttons
    marginBottom: 20,
    backgroundColor: '#B12A2A',
  },
  productGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    marginTop: 40, // More space
    width: '100%',
  },
  productCard: {
    backgroundColor: '#333', // Slightly darker card background
    borderRadius: 15, // More rounded
    padding: 18,
    alignItems: 'center',
    marginBottom: 25,
    width: '46%', // Adjusted for spacing
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  productImage: {
    width: '100%',
    height: 160, // Slightly taller
    borderRadius: 10,
    marginBottom: 12,
    resizeMode: 'cover',
    borderWidth: 1, // Subtle image border
    borderColor: 'rgba(255,255,255,0.1)',
  },
  productName: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 6,
  },
  productPrice: {
    fontSize: 18,
    color: '#FFD700', // Gold color for price
    fontWeight: 'bold',
  },
  // Styles for product screen
  productDetailContainer: {
    width: '95%', // Wider container
    backgroundColor: '#333',
    borderRadius: 20, // More rounded
    padding: 25,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  productDetailImage: {
    width: '100%',
    height: 320, // Taller image
    borderRadius: 15,
    marginBottom: 25,
    resizeMode: 'contain',
    backgroundColor: '#B12A2A', // Background for image
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  productDetailName: {
    fontSize: 30, // Larger name
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
    textAlign: 'center',
  },
  productDetailPrice: {
    fontSize: 26,
    color: '#FFD700', // Gold color for price
    fontWeight: 'bold',
    marginBottom: 25,
  },
  productDetailDescription: {
    fontSize: 17,
    color: '#ccc',
    textAlign: 'center',
    marginBottom: 35,
    lineHeight: 24,
  },
  addToCartButton: {
    width: '85%',
    marginBottom: 18,
  },
  backButton: {
    width: '85%',
    backgroundColor: '#444', // Darker grey for back button
    marginBottom: 18,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  // Styles for my orders / cart
  screenTitle: {
    fontSize: 34, // Larger title
    fontWeight: 'bold',
    color: '#B12A2A',
    marginBottom: 35,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  emptyCartText: {
    fontSize: 19,
    color: '#ccc',
    textAlign: 'center',
    marginTop: 60,
    marginBottom: 30,
  },
  currentCartSection: {
    width: '95%',
    backgroundColor: '#333',
    borderRadius: 15,
    padding: 20,
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20,
    textAlign: 'center',
  },
  cartItem: {
    flexDirection: 'row',
    backgroundColor: '#444', // Slightly lighter for item background
    borderRadius: 10,
    padding: 15,
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  cartItemImage: {
    width: 70,
    height: 70,
    borderRadius: 8,
    marginRight: 15,
    resizeMode: 'cover',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  cartItemDetails: {
    flex: 1,
  },
  cartItemName: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  cartItemPrice: {
    fontSize: 15,
    color: '#ccc',
  },
  cartItemCustomization: {
    fontSize: 13,
    color: '#bbb',
  },
  removeButton: {
    backgroundColor: '#D32F2F', // Darker red for remove
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  removeButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  totalPrice: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFD700', // Gold color for total
    marginTop: 20,
    marginBottom: 15,
    textAlign: 'right',
    width: '100%',
  },
  confirmPurchaseButton: {
    width: '90%',
    alignSelf: 'center',
    marginTop: 15,
  },
  orderCard: {
    width: '95%',
    backgroundColor: '#333',
    borderRadius: 15,
    padding: 20,
    marginBottom: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  orderId: {
    fontSize: 19,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  orderInfo: {
    fontSize: 15,
    color: '#ccc',
    marginBottom: 5,
  },
  orderStatus: {
    fontWeight: 'bold',
    color: '#66BB6A', // Brighter green for status
  },
  orderTotal: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFD700', // Gold color for total
    marginTop: 12,
    textAlign: 'right',
  },
  orderItemsContainer: {
    marginTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#555',
    paddingTop: 15,
  },
  orderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  orderItemImage: {
    width: 55,
    height: 55,
    borderRadius: 8,
    marginRight: 12,
    resizeMode: 'cover',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  orderItemDetails: {
    flex: 1,
  },
  orderItemName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#fff',
  },
  orderItemCustomization: {
    fontSize: 12,
    color: '#bbb',
  },
  orderItemPrice: {
    fontSize: 13,
    color: '#ccc',
  },
  // Styles for forms (Login, Register, Recovery)
  input: {
    width: '85%', // Wider input
    backgroundColor: '#444', // Darker input background
    padding: 16, // More padding
    borderRadius: 10, // More rounded
    marginBottom: 18,
    color: '#fff',
    fontSize: 17,
    borderWidth: 1, // Subtle border
    borderColor: 'rgba(255,255,255,0.15)',
  },
  authButton: {
    width: '85%',
    marginBottom: 18,
  },
  linkText: {
    color: '#FFD700', // Gold color for links
    fontSize: 17,
    marginBottom: 25,
    textDecorationLine: 'underline',
  },
  // Styles for side menu
  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)', // Slightly darker overlay
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
  },
  menuContainer: {
    width: width * 0.7, // Slightly wider menu
    height: '100%',
    backgroundColor: '#1a1a1a', // Even darker background for menu
    paddingTop: 60, // More padding
    paddingHorizontal: 25,
    shadowColor: '#000',
    shadowOffset: { width: 8, height: 0 }, // Stronger shadow
    shadowOpacity: 0.6,
    shadowRadius: 15,
    elevation: 20,
  },
  menuItem: {
    paddingVertical: 18, // More padding
    borderBottomWidth: 1,
    borderBottomColor: '#333', // Darker border
  },
  menuItemText: {
    color: '#fff',
    fontSize: 20, // Larger text
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  // Styles for successful purchase modal
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.8)', // Darker overlay
  },
  modalView: {
    margin: 25,
    backgroundColor: '#333', // Darker modal background
    borderRadius: 25, // More rounded
    padding: 40,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  modalTitle: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#B12A2A',
    marginBottom: 20,
  },
  modalText: {
    marginBottom: 25,
    textAlign: 'center',
    color: '#eee',
    fontSize: 19,
    lineHeight: 26,
  },
  successImage: {
    width: 120, // Larger image
    height: 120,
    marginBottom: 25,
  },
  modalButton: {
    backgroundColor: '#B12A2A',
    marginTop: 15,
    paddingHorizontal: 35,
  },
  // Styles for personalization screen
  previewContainer: {
    width: '95%',
    height: 350, // Taller preview
    backgroundColor: '#B12A2A',
    borderRadius: 20,
    marginBottom: 35,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden', // To ensure the print doesn't go out of bounds
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 12,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  previewProductImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  previewPrintImage: {
    position: 'absolute',
    resizeMode: 'contain',
    // 'top', 'left', 'right', 'alignSelf' properties are applied dynamically
  },
  customizationOptionsContainer: {
    width: '95%',
    backgroundColor: '#333',
    borderRadius: 15,
    padding: 25,
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  optionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
    marginTop: 20,
  },
  optionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    marginBottom: 15,
  },
  optionButton: {
    backgroundColor: '#555',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 25, // More rounded
    marginRight: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  optionButtonSelected: {
    backgroundColor: '#B12A2A',
    borderWidth: 2,
    borderColor: '#fff',
  },
  optionButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
  },
  colorSwatch: {
    width: 45, // Larger swatch
    height: 45,
    borderRadius: 22.5,
    marginRight: 12,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: '#000', // Shadow for swatches
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
  },
  colorSwatchSelected: {
    borderColor: '#fff',
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    marginTop: 10,
  },
  quantityButton: {
    backgroundColor: '#B12A2A',
    width: 45,
    height: 45,
    borderRadius: 22.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 12,
  },
  quantityButtonText: {
    fontSize: 22,
    color: '#fff',
    fontWeight: 'bold',
  },
  quantityText: {
    fontSize: 22,
    color: '#fff',
    fontWeight: 'bold',
    minWidth: 40,
    textAlign: 'center',
  },
  confirmCustomizationButton: {
    width: '85%',
    marginBottom: 18,
  },
  modifyDesignButton: {
    width: '85%',
    backgroundColor: '#444',
    marginBottom: 18,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  authSelectionButton: {
    width: '85%',
    marginBottom: 25,
  },
});

export default App;

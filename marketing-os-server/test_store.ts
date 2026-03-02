import fetch from 'node-fetch';

async function testStoreModule() {
    const baseUrl = 'http://localhost:5000/api/v1';

    try {
        // 1. Create a dynamic test user to get a fresh token
        const userEmail = `test_store_${Date.now()}@example.com`;
        const tenantName = `Test Company ${Date.now()}`;
        console.log(`--- Registering test user: ${userEmail} \nTenant: ${tenantName} ---`);

        const registerRes = await fetch(`${baseUrl}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userName: 'Store Tester',
                tenantName: tenantName,
                email: userEmail,
                password: 'password123',
            })
        });
        const registerData = await registerRes.json();
        const token = registerData.data?.token;

        if (!token) {
            console.log('Failed to get token:', registerData);
            return;
        }

        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        };

        const storeUrl = `${baseUrl}/store`;

        // 2. Create a Product
        console.log('\n--- Creating Product ---');
        const prodRes = await fetch(`${storeUrl}/products`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                name: 'Rose Noir Perfume',
                description: 'A luxurious floral scent.',
                price: 85.00,
                category: 'For Her',
                stock_quantity: 50
            })
        });
        const productData = await prodRes.json();
        console.log('Created Product:', productData);

        const productId = productData.data?.id;

        // 3. Get Products
        console.log('\n--- Fetching Products ---');
        const getProdRes = await fetch(`${storeUrl}/products`, { headers });
        console.log('Products List:', await getProdRes.json());

        if (!productId) return;

        // 4. Create an Order (Mock - fetch existing)
        console.log('\n--- Fetching Orders ---');
        const ordersRes = await fetch(`${storeUrl}/orders`, { headers });
        console.log('Orders List:', await ordersRes.json());

        console.log('\n--- Fetching Analytics ---');
        const analyticsRes = await fetch(`${storeUrl}/analytics`, { headers });
        console.log('Analytics:', await analyticsRes.json());

    } catch (err) {
        console.error('Test Failed:', err);
    }
}

testStoreModule();

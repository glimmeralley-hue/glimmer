const axios = require('axios');

async function testBackend() {
    console.log('🧪 Testing Backend Connectivity...\n');
    
    try {
        // Test 1: Basic connectivity
        console.log('1. Testing basic connection...');
        const testResponse = await axios.get('http://localhost:3000/api/test');
        console.log('✅ Test endpoint:', testResponse.data);
        
        // Test 2: Database connectivity
        console.log('\n2. Testing database connection...');
        const healthResponse = await axios.get('http://localhost:3000/api/health');
        console.log('✅ Health check:', healthResponse.data);
        
        // Test 3: Authentication
        console.log('\n3. Testing authentication...');
        
        // Test signup
        const signupResponse = await axios.post('http://localhost:3000/api/signup', {
            username: 'testuser',
            email: 'test@example.com',
            password: 'test123',
            phone: '0712345678'
        });
        console.log('✅ Signup:', signupResponse.data);
        
        // Test signin
        const signinResponse = await axios.post('http://localhost:3000/api/signin', {
            email: 'test@example.com',
            password: 'test123'
        });
        console.log('✅ Signin:', signinResponse.data);
        
        // Test 4: Profile data
        console.log('\n4. Testing profile data...');
        const profileResponse = await axios.get('http://localhost:3000/api/get_profile/test@example.com');
        console.log('✅ Profile:', profileResponse.data);
        
        // Test 5: Social features
        console.log('\n5. Testing social features...');
        const thoughtsResponse = await axios.get('http://localhost:3000/api/get_thoughts');
        console.log('✅ Thoughts:', `${thoughts.data.length} thoughts loaded`);
        
        console.log('\n🎉 ALL TESTS PASSED! Backend is fully functional!');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        if (error.response) {
            console.error('Response data:', error.response.data);
            console.error('Status:', error.response.status);
        }
    }
}

testBackend();

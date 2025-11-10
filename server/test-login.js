// Test login API
import axios from 'axios';

const testLogin = async () => {
  try {
    console.log('Testing login API...');
    console.log('URL: http://localhost:5000/api/auth/login');
    console.log('Credentials: admin@iitgn.ac.in / admin123\n');
    
    const response = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'admin@iitgn.ac.in',
      password: 'admin123'
    });
    
    console.log('✅ Login successful!');
    console.log('Response:', JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.error('❌ Login failed!');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else if (error.request) {
      console.error('No response received from server');
      console.error('Request:', error.request);
    } else {
      console.error('Error:', error.message);
    }
  }
};

testLogin();

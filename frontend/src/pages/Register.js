import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { RadioGroup, RadioGroupItem } from '../components/ui/radio-group';
import { toast } from 'sonner';

const Register = () => {
  const [searchParams] = useSearchParams();
  const defaultRole = searchParams.get('role') || 'customer';
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '',
    role: defaultRole,
    company_name: '',
  });
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const result = await register(formData);
    
    if (result.success) {
      toast.success('Account created successfully!');
      navigate('/');
    } else {
      toast.error(result.error || 'Registration failed');
    }
    
    setLoading(false);
  };

  return (
    <div data-testid="register-page" className="min-h-[80vh] flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 data-testid="register-title" className="text-4xl font-bold text-[#121212]">Create Account</h2>
          <p className="mt-2 text-gray-600">Join our marketplace today</p>
        </div>

        <form data-testid="register-form" onSubmit={handleSubmit} className="mt-8 space-y-6 bg-white p-8 rounded-2xl border border-gray-200">
          <div className="space-y-4">
            <div>
              <Label htmlFor="full_name">Full Name</Label>
              <Input
                data-testid="fullname-input"
                id="full_name"
                name="full_name"
                type="text"
                required
                value={formData.full_name}
                onChange={handleChange}
                placeholder="John Doe"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="email">Email Address</Label>
              <Input
                data-testid="email-input"
                id="email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleChange}
                placeholder="your@email.com"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                data-testid="password-input"
                id="password"
                name="password"
                type="password"
                required
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                className="mt-1"
              />
            </div>

            <div>
              <Label>Account Type</Label>
              <RadioGroup
                value={formData.role}
                onValueChange={(value) => setFormData({ ...formData, role: value })}
                className="mt-2 space-y-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem data-testid="role-customer" value="customer" id="customer" />
                  <Label htmlFor="customer" className="font-normal cursor-pointer">
                    Customer - I want to buy products
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem data-testid="role-seller" value="seller" id="seller" />
                  <Label htmlFor="seller" className="font-normal cursor-pointer">
                    Seller - I want to sell products
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {formData.role === 'seller' && (
              <div>
                <Label htmlFor="company_name">Company Name (Optional)</Label>
                <Input
                  data-testid="company-input"
                  id="company_name"
                  name="company_name"
                  type="text"
                  value={formData.company_name}
                  onChange={handleChange}
                  placeholder="Your Company LLC"
                  className="mt-1"
                />
              </div>
            )}
          </div>

          <Button data-testid="submit-button" type="submit" className="w-full" disabled={loading}>
            {loading ? 'Creating Account...' : 'Create Account'}
          </Button>

          <p className="text-center text-sm text-gray-600">
            Already have an account?{' '}
            <Link data-testid="login-link" to="/login" className="text-[#0071E3] hover:underline font-medium">
              Sign in
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Register;
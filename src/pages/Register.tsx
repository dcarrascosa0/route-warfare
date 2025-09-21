import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { GatewayAPI } from "@/lib/api";
import { Link, useNavigate } from "react-router-dom";

const Register = () => {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const validatePassword = (password: string): string | null => {
    if (password.length < 8) {
      return "Password must be at least 8 characters long";
    }
    if (!/[A-Z]/.test(password)) {
      return "Password must contain at least one uppercase letter";
    }
    if (!/[a-z]/.test(password)) {
      return "Password must contain at least one lowercase letter";
    }
    if (!/\d/.test(password)) {
      return "Password must contain at least one digit";
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      return "Password must contain at least one special character";
    }
    return null;
  };

  const validateUsername = (username: string): string | null => {
    if (username.length < 3 || username.length > 50) {
      return "Username must be between 3 and 50 characters";
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
      return "Username can only contain letters, numbers, underscores, and hyphens";
    }
    return null;
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Client-side validation
    const usernameError = validateUsername(username);
    if (usernameError) {
      setError(usernameError);
      return;
    }

    const passwordError = validatePassword(password);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      const res = await GatewayAPI.register(email, username, password);
      if (!res.ok) {
        const errorData = res.error as any;
        let msg = "Registration failed";
        
        if (errorData?.detail) {
          if (Array.isArray(errorData.detail)) {
            // Handle validation errors from Pydantic
            msg = errorData.detail.map((err: any) => err.msg || err.message || err).join(", ");
          } else {
            msg = errorData.detail;
          }
        }
        
        setError(msg);
        return;
      }
      
      // After successful registration, navigate to login with success message
      navigate("/login?message=Registration successful! Please log in with your credentials.");
    } catch (err) {
      console.error("Registration error:", err);
      setError("Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-card/80 border-border/50">
        <CardHeader>
          <CardTitle className="text-xl">Create account</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="text-sm">Email</label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div>
              <label className="text-sm">Username</label>
              <Input 
                value={username} 
                onChange={(e) => setUsername(e.target.value)} 
                placeholder="3-50 characters, letters, numbers, _, -"
                required 
              />
            </div>
            <div>
              <label className="text-sm">Password</label>
              <Input 
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                placeholder="Min 8 chars, uppercase, lowercase, digit, special char"
                required 
              />
            </div>
            <div>
              <label className="text-sm">Confirm Password</label>
              <Input 
                type="password" 
                value={confirmPassword} 
                onChange={(e) => setConfirmPassword(e.target.value)} 
                required 
              />
            </div>
            {error && <div className="text-sm text-destructive">{error}</div>}
            <Button type="submit" className="w-full bg-gradient-hero hover:shadow-glow" disabled={loading}>
              {loading ? "Creating…" : "Create account"}
            </Button>
          </form>
          <div className="text-sm text-muted-foreground mt-4">
            Already have an account? <Link to="/login" className="text-primary">Sign in</Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Register;



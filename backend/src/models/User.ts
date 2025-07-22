import { Document, Schema, model, Types } from "mongoose";
import bcrypt from 'bcrypt';

interface IUserProfile {
  name?: string;
  bio?: string;
  avatar?: string;
  website?: string;
}

interface IUser extends Document {
  googleId?: string | null; // Nullable for users without Google login
  // Ensure username is unique, required, and matches regex for alphanumeric and underscores
  username: string;
  email: string;
  password: string;
  profile: IUserProfile;
  followers: Types.ObjectId[];
  following: Types.ObjectId[];
  postsCount: number;
  followersCount: number;
  followingCount: number;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword:string) : Promise<boolean>
}

const UserSchema = new Schema<IUser>(
  {
    googleId: {
      type: String,
      unique: true,
      sparse: true, // Allows for null values without index conflicts
      default: null
    },
    username: { 
      type: String, 
      unique: true, 
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 30,
      match: /^[a-zA-Z0-9_]+$/ // Schema-level regex
    },
    email: { 
      type: String, 
      unique: true, 
      required: true,
      trim: true,
      lowercase: true,
      min:8,
      max:30,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Invalid email'] 
    },
    password: { 
      type: String, 
      default: '',
      minlength: 8,
      validate: { // Custom validator
        validator: function(v: string) {
          return /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+])/.test(v);
        },
        message: 'Password must contain 1 uppercase, 1 number, 1 symbol'
      },
      select: false // Never return password in queries
    },
    profile: {
      name: { type: String, trim: true, maxlength: 50 },
      bio: { type: String, trim: true, maxlength: 200 },
      avatar: { type: String, default: 'default-avatar-url.jpg' },
      website: { 
        type: String,
        validate: {
          validator: (value: string) => {
            return /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/.test(value);
          },
          message: props => `${props.value} is not a valid URL!`
        }
      },
      default: {}
    },
    followers: [{ 
      type: Types.ObjectId, 
      ref: 'User',
      default: []
    }],
    following: [{ 
      type: Types.ObjectId, 
      ref: 'User',
      default: []
    }],
    postsCount: { 
      type: Number, 
      default: 0,
      min: 0
    },
    followersCount: { 
      type: Number, 
      default: 0,
      min: 0
    },
    followingCount: { 
      type: Number, 
      default: 0,
      min: 0
    }
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt
    toJSON: {
      virtuals: true,
      transform: function(doc, ret) {
        delete ret.password; // Never return password in JSON
        return ret;
      }
    },
    toObject: {
      virtuals: true,
      transform: function(doc, ret) {
        delete ret.password; // Never return password in objects
        return ret;
      }
    }
  }
);

// Indexes for better query performance
UserSchema.index({ username: 1 });
UserSchema.index({ email: 1 });
UserSchema.index({ followersCount: -1 });
UserSchema.index({ postsCount: -1 });

// Virtual for profile URL
UserSchema.virtual('profileUrl').get(function() {
  return `/users/${this.username}`;
});

// Middleware to hash password before saving
UserSchema.pre<IUser>('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err as Error);
  }
});

// Method to compare passwords
UserSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  return await bcrypt.compare(candidatePassword, this.password);
};

const User = model<IUser>('User', UserSchema);
export default User;
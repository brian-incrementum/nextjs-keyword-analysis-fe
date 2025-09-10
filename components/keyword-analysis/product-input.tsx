'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Button } from '@/components/ui/button';
import { Package, FileText } from 'lucide-react';
import type { ProductInput, CountryCode, InputMode } from '@/types/keyword-analysis';

const countries: { code: CountryCode; name: string }[] = [
  { code: 'US', name: 'United States' },
  { code: 'UK', name: 'United Kingdom' },
  { code: 'DE', name: 'Germany' },
  { code: 'FR', name: 'France' },
  { code: 'IT', name: 'Italy' },
  { code: 'ES', name: 'Spain' },
  { code: 'CA', name: 'Canada' },
  { code: 'JP', name: 'Japan' },
  { code: 'IN', name: 'India' },
  { code: 'MX', name: 'Mexico' },
  { code: 'BR', name: 'Brazil' },
  { code: 'AU', name: 'Australia' },
  { code: 'NL', name: 'Netherlands' },
];

const asinSchema = z.object({
  mode: z.literal('asin'),
  asin: z.string().min(10, 'ASIN must be at least 10 characters').max(10, 'ASIN must be exactly 10 characters'),
  country: z.enum(['US', 'UK', 'DE', 'FR', 'JP', 'CA', 'IT', 'ES', 'IN', 'MX', 'BR', 'AU', 'NL'] as const),
});

const descriptionSchema = z.object({
  mode: z.literal('description'),
  description: z.string().min(20, 'Product description must be at least 20 characters'),
});

const formSchema = z.discriminatedUnion('mode', [asinSchema, descriptionSchema]);

interface ProductInputProps {
  onSubmit: (data: ProductInput) => void;
  isDisabled?: boolean;
}

export function ProductInputComponent({ onSubmit, isDisabled = false }: ProductInputProps) {
  const [inputMode, setInputMode] = useState<InputMode>('asin');

  const form = useForm<ProductInput>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      mode: 'asin',
      asin: '',
      country: 'US',
    },
  });

  const handleModeChange = (mode: InputMode) => {
    setInputMode(mode);
    if (mode === 'asin') {
      form.reset({
        mode: 'asin',
        asin: '',
        country: 'US',
      });
    } else {
      form.reset({
        mode: 'description',
        description: '',
      });
    }
  };

  const handleSubmit = (data: ProductInput) => {
    onSubmit(data);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Product Information</CardTitle>
        <CardDescription>
          Enter product details using either an ASIN with country code or a product description
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          <div className="space-y-3">
            <Label>Input Method</Label>
            <RadioGroup
              value={inputMode}
              onValueChange={(value) => handleModeChange(value as InputMode)}
              disabled={isDisabled}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="asin" id="asin-mode" />
                <Label htmlFor="asin-mode" className="flex items-center cursor-pointer">
                  <Package className="w-4 h-4 mr-2" />
                  ASIN + Country
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="description" id="description-mode" />
                <Label htmlFor="description-mode" className="flex items-center cursor-pointer">
                  <FileText className="w-4 h-4 mr-2" />
                  Product Description
                </Label>
              </div>
            </RadioGroup>
          </div>

          {inputMode === 'asin' ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="asin">ASIN</Label>
                <Input
                  id="asin"
                  placeholder="e.g., B08N5WRWNW"
                  {...form.register('asin')}
                  disabled={isDisabled}
                />
                {inputMode === 'asin' && 'asin' in form.formState.errors && form.formState.errors.asin && (
                  <p className="text-sm text-red-500">{form.formState.errors.asin.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Select
                  value={form.watch('country')}
                  onValueChange={(value) => form.setValue('country', value as CountryCode)}
                  disabled={isDisabled}
                >
                  <SelectTrigger id="country">
                    <SelectValue placeholder="Select a country" />
                  </SelectTrigger>
                  <SelectContent>
                    {countries.map((country) => (
                      <SelectItem key={country.code} value={country.code}>
                        {country.name} ({country.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {inputMode === 'asin' && 'country' in form.formState.errors && form.formState.errors.country && (
                  <p className="text-sm text-red-500">{form.formState.errors.country.message}</p>
                )}
              </div>
            </>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="description">Product Description</Label>
              <Textarea
                id="description"
                placeholder="Enter a detailed product description..."
                rows={5}
                {...form.register('description')}
                disabled={isDisabled}
              />
              {inputMode === 'description' && 'description' in form.formState.errors && form.formState.errors.description && (
                <p className="text-sm text-red-500">{form.formState.errors.description.message}</p>
              )}
            </div>
          )}

          <Button type="submit" disabled={isDisabled} className="w-full">
            Continue to Keywords Upload
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
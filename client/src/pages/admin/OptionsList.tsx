import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLocation } from 'wouter';

interface CardOption {
  id: string;
  optionSetId: string;
  name: string;
  description: string;
  value: string;
  icon: string;
  order: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface CardOptionSet {
  id: string;
  name: string;
  description: string;
  minSelection: number;
  maxSelection: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface OptionWithSet extends CardOption {
  optionSet?: CardOptionSet;
}

export default function OptionsList() {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState('');

  // Завантажуємо всі набори варіантів
  const { data: optionSets } = useQuery<CardOptionSet[]>({
    queryKey: ['/api/admin/card-option-sets']
  });

  // Завантажуємо всі варіанти
  const { data: allOptions, isLoading } = useQuery<CardOption[]>({
    queryKey: ['/api/admin/card-options/all'],
    enabled: !!optionSets
  });

  // Об'єднуємо дані варіантів з наборами
  const optionsWithSets: OptionWithSet[] = allOptions?.map(option => ({
    ...option,
    optionSet: optionSets?.find(set => set.id === option.optionSetId)
  })) || [];

  // Фільтруємо варіанти за пошуковим запитом
  const filteredOptions = optionsWithSets.filter(option => {
    const query = searchQuery.toLowerCase();
    return (
      option.name.toLowerCase().includes(query) ||
      option.description.toLowerCase().includes(query) ||
      option.value.toLowerCase().includes(query) ||
      option.optionSet?.name.toLowerCase().includes(query) ||
      option.optionSet?.description.toLowerCase().includes(query)
    );
  });

  // Групуємо варіанти за наборами
  const groupedOptions = filteredOptions.reduce((groups, option) => {
    const setId = option.optionSetId;
    if (!groups[setId]) {
      groups[setId] = {
        optionSet: option.optionSet!,
        options: []
      };
    }
    groups[setId].options.push(option);
    return groups;
  }, {} as Record<string, { optionSet: CardOptionSet; options: OptionWithSet[] }>);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Package className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Перелік Варіантів
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Управління попередньо заготовленими варіантами для карток (архетипи, цінності тощо)
              </p>
            </div>
          </div>
          <Button 
            onClick={() => setLocation('/admin/card-option-sets')}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Назад
          </Button>
        </div>

        {/* Search */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Пошук варіантів по назві, опису, значенню або набору..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                data-testid="input-search-options"
              />
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {filteredOptions.length}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Знайдено варіантів
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {Object.keys(groupedOptions).length}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Активних наборів
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {allOptions?.length || 0}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Загалом варіантів
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Options by Sets */}
        {isLoading ? (
          <div className="text-center py-8">
            <div className="text-gray-600 dark:text-gray-400">Завантаження...</div>
          </div>
        ) : Object.keys(groupedOptions).length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">
                {searchQuery ? 'Варіанти не знайдені за вашим запитом' : 'Варіанти відсутні'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {Object.values(groupedOptions).map(({ optionSet, options }) => (
              <Card key={optionSet.id} className="border-l-4 border-l-blue-500">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        <Package className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        {optionSet.name}
                      </CardTitle>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {optionSet.description}
                      </p>
                      <div className="flex items-center gap-4 mt-2">
                        <Badge variant="outline" className="text-xs">
                          ID: {optionSet.id}
                        </Badge>
                        <Badge variant={optionSet.isActive ? 'default' : 'secondary'} className="text-xs">
                          {optionSet.isActive ? 'Активний' : 'Неактивний'}
                        </Badge>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          Вибір: {optionSet.minSelection}-{optionSet.maxSelection}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {options.map((option, index) => (
                      <div
                        key={option.id}
                        className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                        data-testid={`option-${option.id}`}
                      >
                        <div className="flex items-start gap-3">
                          <span className="text-xl">{option.icon}</span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-medium text-gray-900 dark:text-white truncate">
                                {option.name}
                              </h4>
                              <Badge variant="outline" className="text-xs font-mono">
                                #{option.order}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                              {option.description}
                            </p>
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary" className="text-xs font-mono">
                                {option.value}
                              </Badge>
                              <Badge variant={option.isActive ? 'default' : 'destructive'} className="text-xs">
                                {option.isActive ? 'Активний' : 'Неактивний'}
                              </Badge>
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                              ID: {option.id}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}